"use client";

import { createContext, useContext, type ReactNode, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSignMessage, WagmiProvider, type Config, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useChainId } from "wagmi";
import { useAccount, useBalance, useDisconnect } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { XellarKitProvider, defaultConfig, darkTheme, useConnectModal } from "@xellar/kit";
import axios from "axios";
import { baseSepolia } from "viem/chains";
import { createPublicClient, http } from "viem";
import { getClientConfig } from "@/lib/client-config";
import { useIDRXBalance } from "@/hooks/useIDRXBalance";
import { CONTRACT_ADDRESSES, MockIDRXABI, ZKTCoreABI } from "@/lib/abi";
import { AlertTriangle } from "lucide-react";

const queryClient = new QueryClient();

type DonationParams = {
  poolId: bigint | string;
  campaignTitle: string;
  amountIDRX: bigint;
  ipfsCID?: string;
};

type WalletContextType = {
  address: string | undefined;
  isConnected: boolean;
  balance: string;
  idrxBalance: bigint | undefined;
  formattedIdrxBalance: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  donate: (params: DonationParams) => Promise<{ txHash: string }>;
  isDonating: boolean;
};

const WalletContext = createContext<WalletContextType>({
  address: undefined,
  isConnected: false,
  balance: "0",
  idrxBalance: undefined,
  formattedIdrxBalance: "0",
  connect: async () => {
    console.warn("Connect function should be triggered by XellarKit UI components.");
  },
  disconnect: () => {},
  donate: async () => ({ txHash: "0x0" }),
  isDonating: false,
});

export const useWallet = () => useContext(WalletContext);

// Component to enforce Base Sepolia chain connection
function ChainEnforcer({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [showWarning, setShowWarning] = useState(false);

  const isWrongChain = isConnected && chainId !== baseSepolia.id;

  useEffect(() => {
    if (isWrongChain) {
      setShowWarning(true);
      // Auto-attempt to switch chain when user connects with wrong chain
      switchChain(
        { chainId: baseSepolia.id },
        {
          onSuccess: () => {
            setShowWarning(false);
            toast({
              title: "Network Switched",
              description: "Successfully connected to Base Sepolia",
            });
          },
          onError: (error) => {
            console.error("Failed to switch chain:", error);
            toast({
              variant: "destructive",
              title: "Network Switch Required",
              description: "Please switch to Base Sepolia network to use this app",
            });
          },
        }
      );
    } else {
      setShowWarning(false);
    }
  }, [isWrongChain, switchChain, toast]);

  const handleManualSwitch = () => {
    switchChain(
      { chainId: baseSepolia.id },
      {
        onSuccess: () => {
          setShowWarning(false);
          toast({
            title: "Network Switched",
            description: "Successfully connected to Base Sepolia",
          });
        },
        onError: (error) => {
          console.error("Failed to switch chain:", error);
          toast({
            variant: "destructive",
            title: "Switch Failed",
            description: "Please manually switch to Base Sepolia in your wallet",
          });
        },
      }
    );
  };

  return (
    <>
      {showWarning && isWrongChain && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-yellow-500 text-black px-4 py-3 flex items-center justify-center gap-3 shadow-lg">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">
            Wrong network detected. Please switch to Base Sepolia to use this app.
          </span>
          <button
            onClick={handleManualSwitch}
            disabled={isSwitching}
            className="ml-2 px-4 py-1.5 bg-black text-white rounded-md font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSwitching ? "Switching..." : "Switch Network"}
          </button>
        </div>
      )}
      <div className={showWarning && isWrongChain ? "pt-14" : ""}>
        {children}
      </div>
    </>
  );
}

// Inner component to handle context logic and wagmi hooks
function WalletStateController({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isDonating, setIsDonating] = useState(false);

  const { address: wagmiAddress, isConnected: wagmiIsConnected, status: wagmiStatus } = useAccount();
  const { data: wagmiBalanceData } = useBalance({ address: wagmiAddress });
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  // Get real IDRX balance from blockchain
  const { balance: idrxBalance, formattedBalance: formattedIdrxBalance, refetch: refetchBalance } = useIDRXBalance();

  // Contract write hooks for donation flow
  const { writeContractAsync } = useWriteContract();

  const address = wagmiAddress;
  const isConnected = wagmiIsConnected;
  const balance = wagmiBalanceData?.formatted ?? "0";

  const { open } = useConnectModal();

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const signAuthMessage = async () => {
    // Check if access token already exists
    const existingToken = localStorage.getItem("access_token");
    if (existingToken) {
      return;
    }
    try {
      const response = await axios.post(`${baseUrl}/auth/request-message`, {
        wallet_address: address,
      });

      const { message } = response.data;
      const signature = await signMessageAsync({ message });

      const signatureResponse = await axios.post(`${baseUrl}/auth/verify`, {
        message: message,
        signature: signature,
        wallet_address: address,
      });

      const { access_token } = signatureResponse.data;
      localStorage.setItem("access_token", access_token);
    } catch (error) {
      console.error("Error requesting or signing message:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to authenticate wallet",
      });
    }
  };

  useEffect(() => {
    if (wagmiStatus === "connected") {
      // TODO: fix this
      // signAuthMessage();
    } else if (wagmiStatus === "disconnected") {
    }
  }, [wagmiStatus, address, toast]);

  const donate = async (params: DonationParams): Promise<{ txHash: string }> => {
    const { poolId, campaignTitle, amountIDRX, ipfsCID = "" } = params;

    // Comprehensive validation
    if (!amountIDRX || amountIDRX <= BigInt(0)) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Amount must be greater than 0",
      });
      throw new Error("Invalid amount: must be greater than 0");
    }

    if (!isConnected || !address) {
      toast({
        variant: "destructive",
        title: "Wallet Not Connected",
        description: "Please connect your wallet to continue",
      });
      throw new Error("Wallet not connected");
    }

    if (!poolId) {
      toast({
        variant: "destructive",
        title: "Invalid Campaign",
        description: "Invalid campaign ID",
      });
      throw new Error("Invalid campaign ID");
    }

    // Validate poolId value
    if (typeof poolId === 'bigint' && poolId <= BigInt(0)) {
      toast({
        variant: "destructive",
        title: "Invalid Campaign",
        description: "Invalid campaign ID",
      });
      throw new Error("Invalid campaign ID");
    }

    if (idrxBalance && amountIDRX > idrxBalance) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: "Your wallet doesn't have enough funds",
      });
      throw new Error("Insufficient IDRX balance");
    }

    setIsDonating(true);

    try {
      // Step 1: Approve IDRX tokens to ZKTCore contract
      toast({
        title: "Approval Required",
        description: "Please approve the contract to spend your IDRX tokens",
      });

      console.log(`[Donate] Starting approval for ${amountIDRX.toString()} IDRX to ${CONTRACT_ADDRESSES.ZKTCore}`);

      const approvalTxHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.MockIDRX,
        abi: MockIDRXABI,
        functionName: "approve",
        args: [CONTRACT_ADDRESSES.ZKTCore, amountIDRX],
        account: address as `0x${string}`,
      });

      console.log(`[Donate] Approval tx hash: ${approvalTxHash}`);

      // Add delay to ensure approval is processed
      await new Promise(resolve => setTimeout(resolve, 3000));

      toast({
        title: "Approval Confirmed",
        description: "Now processing your donation...",
      });

      // Step 2: Execute donation through ZKTCore
      // Convert poolId to uint256 (bigint)
      const poolIdUint = typeof poolId === 'string' ? BigInt(poolId) : poolId;

      console.log(`[Donate] Pool ID: ${poolIdUint.toString()}`);
      console.log(`[Donate] Amount: ${amountIDRX.toString()}`);
      console.log(`[Donate] IPFS CID: ${ipfsCID || "none"}`);

      // Get gas fees for better estimation
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(),
      });

      let gasPrice = BigInt(1000000000); // 1 gwei default
      try {
        const feeData = await publicClient.getGasPrice();
        gasPrice = feeData;
        console.log(`[Donate] Network gas price: ${gasPrice.toString()} wei`);
      } catch (error) {
        console.log(`[Donate] Using default gas price: ${gasPrice.toString()} wei`);
      }

      const donateTxHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.ZKTCore,
        abi: ZKTCoreABI,
        functionName: "donate",
        args: [poolIdUint, amountIDRX, ipfsCID],
        account: address as `0x${string}`,
        gasPrice: gasPrice,
      });

      toast({
        title: "Donation Successful! 🎉",
        description: `You donated ${amountIDRX.toString()} IDRX to ${campaignTitle}`,
      });

      // Refetch balance after successful donation
      await refetchBalance();

      return { txHash: donateTxHash };
    } catch (error: any) {
      console.error("❌ Donation error details:", {
        message: error?.message,
        code: error?.code,
        reason: error?.reason,
        data: error?.data,
        cause: error?.cause,
        chainId: error?.chainId,
        contractAddress: CONTRACT_ADDRESSES.ZKTCore,
        senderAddress: address,
        fullError: error,
      });

      let errorMessage = "Transaction failed. Please try again.";
      if (error?.reason) errorMessage = error.reason;
      else if (error?.message) errorMessage = error.message;

      toast({
        variant: "destructive",
        title: "Donation Failed",
        description: errorMessage,
      });
      throw error;
    } finally {
      setIsDonating(false);
    }
  };

  const connect = async () => {
    console.warn("Programmatic connect via context is not standard with XellarKit. Please use XellarKit's UI components.");
    toast({
      variant: "default",
      title: "Connect Wallet",
      description: "Please use the dedicated UI button to connect your wallet.",
    });
    open();
  };

  const disconnect = () => {
    wagmiDisconnect();
    // Remove the access token from localStorage when disconnecting
    localStorage.removeItem("access_token");
    console.log("Wallet disconnect initiated via context");
    toast({
      title: "Wallet disconnected",
      description: "Your wallet has been disconnected.",
    });
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected,
        balance,
        idrxBalance,
        formattedIdrxBalance,
        connect,
        disconnect,
        donate,
        isDonating,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const [clientConfig, setClientConfig] = useState<Config | null>(null);

  useEffect(() => {
    setIsClient(true); // mark client
    setClientConfig(getClientConfig()); // safe to call browser-only APIs here
  }, []);

  if (!isClient || !clientConfig) return null; // prevent SSR and invalid config

  return (
    <WagmiProvider config={clientConfig}>
      <QueryClientProvider client={queryClient}>
        <XellarKitProvider theme={darkTheme}>
          <ChainEnforcer>
            <WalletStateController>{children}</WalletStateController>
          </ChainEnforcer>
        </XellarKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Upload, MapPin, Target, 
  CheckCircle2, Loader2, X, AlertCircle,
  Users, Lock, Wallet, ArrowLeft
} from 'lucide-react';
import { useCreateCampaignWithSafe } from '@/hooks/useCreateCampaignWithSafe';
import { useAccount } from 'wagmi';
import { toast } from '@/components/ui/use-toast';
import { keccak256, stringToBytes } from 'viem';
import { uploadFilesToPinata } from '@/lib/pinata-client';

const SAFE_SIGNERS = [
  '0xB4D04aFd15Fa8752EE94B1510A755e04d362876D',
  '0x9F5952826B61f1Aab3A4E7E8Fb238a8894D1D174',
  '0xeF4DB09D536439831FEcaA33fE4250168976535E',
  '0xE509912bAA5Dd52F3f51E994bb9F9A79FDd2249a',
  '0x027822307511a055eB0f5907F2685DaB1204e14B',
];

export default function CreateCampaignPage() {
  const [isClientReady, setIsClientReady] = useState(false)

  useEffect(() => {
    setIsClientReady(true)
  }, [])

  if (!isClientReady) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return <CreateCampaignInner />
}

// Helper function to generate campaign ID from name
const generateCampaignId = (name: string): string => {
  if (!name.trim()) return '';
  const hash = keccak256(stringToBytes(name.trim()));
  return hash;
};

// Helper to format date for input[type="datetime-local"]
const dateToLocalString = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toISOString().slice(0, 16); // Returns "YYYY-MM-DDTHH:mm"
};

// Helper to convert local datetime string to Unix timestamp
const localStringToTimestamp = (localString: string): number => {
  const date = new Date(localString);
  return Math.floor(date.getTime() / 1000);
};

function CreateCampaignInner() {
  const { address: userAddress, isConnected } = useAccount();
  const { 
    createCampaignWithSafe, 
    isLoading,
    isHydrated,
  } = useCreateCampaignWithSafe();
  
  const [isSigner, setIsSigner] = useState(false);
  const [step, setStep] = useState(1);
  const [createdCampaign, setCreatedCampaign] = useState<any>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const isMountedRef = useRef(false);
  
  // Check if user is Safe signer (only after hydration)
  useEffect(() => {
    isMountedRef.current = true;
    
    // Delay to ensure hydration is complete
    const timeoutId = setTimeout(() => {
      if (!userAddress) {
        if (isMountedRef.current) {
          setIsSigner(false);
        }
        return;
      }
      
      if (isMountedRef.current) {
        const isUserSigner = SAFE_SIGNERS.some(
          (signer) => signer.toLowerCase() === userAddress.toLowerCase()
        );
        setIsSigner(isUserSigner);
      }
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [userAddress]);
  
  // Initialize start and end times
  const now = Math.floor(Date.now() / 1000);
  const defaultEndTime = now + (30 * 24 * 60 * 60); // 30 days from now
  
  const [campaignData, setCampaignData] = useState({
    name: '',
    description: '',
    category: 'Emergency',
    location: '',
    goal: '',
    organizationName: '',
    organizationVerified: false,
    tags: [] as string[],
    startTime: now,
    endTime: defaultEndTime
  });

  const categories = ['Emergency', 'Education', 'Healthcare', 'Environment', 'Community'];

  // Image handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      
      if (imageFiles.length + newFiles.length > 5) {
        toast({ 
          title: 'Too Many Images', 
          description: 'Maximum 5 images allowed', 
          variant: 'destructive' 
        });
        return;
      }

      const invalidFiles = newFiles.filter(f => f.size > 5 * 1024 * 1024);
      if (invalidFiles.length > 0) {
        toast({ 
          title: 'File Too Large', 
          description: 'Each image must be less than 5MB', 
          variant: 'destructive' 
        });
        return;
      }
      
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setImageFiles(prev => [...prev, ...newFiles]);
      setImagePreviewUrls(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (idx: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    URL.revokeObjectURL(imagePreviewUrls[idx]);
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== idx));
  };

  // Validation
  const validateForm = (): boolean => {
    console.log('🔍 Form Data:', { campaignData, imageFiles });

    if (!campaignData.name.trim() || campaignData.name.length < 10) {
      console.error('❌ Name validation failed:', campaignData.name);
      toast({ title: 'Error', description: 'Campaign name must be at least 10 characters', variant: 'destructive' });
      return false;
    }
    if (!campaignData.description.trim() || campaignData.description.length < 50) {
      console.error('❌ Description validation failed:', campaignData.description);
      toast({ title: 'Error', description: 'Description must be at least 50 characters', variant: 'destructive' });
      return false;
    }
    if (!campaignData.location.trim()) {
      console.error('❌ Location validation failed');
      toast({ title: 'Error', description: 'Location is required', variant: 'destructive' });
      return false;
    }

    const goal = parseFloat(campaignData.goal);
    if (!campaignData.goal || isNaN(goal) || goal < 1000) {
      console.error('❌ Goal validation failed:', campaignData.goal);
      toast({ title: 'Error', description: 'Minimum funding goal is 1,000 IDRX', variant: 'destructive' });
      return false;
    }

    if (!campaignData.organizationName.trim()) {
      console.error('❌ Organization name validation failed');
      toast({ title: 'Error', description: 'Organization name is required', variant: 'destructive' });
      return false;
    }

    if (!campaignData.startTime || campaignData.startTime <= 0) {
      console.error('❌ Start time validation failed');
      toast({ title: 'Error', description: 'Start time is required', variant: 'destructive' });
      return false;
    }

    if (!campaignData.endTime || campaignData.endTime <= campaignData.startTime) {
      console.error('❌ End time validation failed');
      toast({ title: 'Error', description: 'End time must be after start time', variant: 'destructive' });
      return false;
    }

    if (imageFiles.length === 0) {
      console.error('❌ No images uploaded');
      toast({ title: 'Error', description: 'At least one image is required', variant: 'destructive' });
      return false;
    }

    console.log('✅ All validations passed!');
    return true;
  };

  // Submit
  const handleSubmit = async () => {
    console.log('🔵 Button clicked - handleSubmit called');

    if (!isConnected || !userAddress) {
      toast({ title: 'Not Connected', description: 'Please connect MetaMask first', variant: 'destructive' });
      return;
    }

    if (!isSigner) {
      toast({ title: 'Not a Signer', description: 'Only Safe signers can create campaigns', variant: 'destructive' });
      return;
    }

    console.log('📝 Validating form...');
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }

    console.log('✅ Form validation passed');
    setStep(2);

    try {
      console.log('✅ Form validation passed');
      console.log('🔐 Creating campaign via Safe multisig...');

      // Auto-generate campaign ID from name
      const generatedCampaignId = generateCampaignId(campaignData.name);

      // Upload images to Pinata
      let uploadedImageUrls: string[] = [];
      if (imageFiles.length > 0) {
        console.log('📤 Uploading images to Pinata...');
        try {
          uploadedImageUrls = await uploadFilesToPinata(imageFiles);
          console.log('✅ Images uploaded:', uploadedImageUrls);
        } catch (uploadError) {
          console.error('⚠️ Image upload failed, continuing with local URLs:', uploadError);
          // Continue with campaign creation even if image upload fails
          // but notify the user
          toast({
            title: '⚠️ Image Upload Warning',
            description: 'Images could not be uploaded to Pinata. Campaign will be created with local URLs.',
          });
        }
      }

      // Call the Safe transaction with the proper parameters AND metadata
      const result = await createCampaignWithSafe({
        campaignId: generatedCampaignId,
        startTime: campaignData.startTime,
        endTime: campaignData.endTime,
        title: campaignData.name,
        description: campaignData.description,
        category: campaignData.category,
        location: campaignData.location,
        goal: parseFloat(campaignData.goal),
        organizationName: campaignData.organizationName,
        organizationVerified: campaignData.organizationVerified,
        tags: campaignData.tags,
        imageUrls: uploadedImageUrls.length > 0 ? uploadedImageUrls : imagePreviewUrls, // Use uploaded URLs if available, otherwise use preview URLs
      });

      console.log('📊 createCampaignWithSafe result:', result);

      // Campaign proposal created successfully
      const createdData = {
        isSafeTransaction: true,
        campaignTitle: campaignData.name,
        campaignDescription: campaignData.description,
        chainCampaignId: generatedCampaignId,
        chainStartTime: campaignData.startTime,
        chainEndTime: campaignData.endTime,
        safeTxHash: result?.safeTxHash || '',
        imageUrls: [],
      };
      console.log('✅ Campaign proposed to Safe:', createdData);
      setCreatedCampaign(createdData);
      setStep(3);
    } catch (error) {
      console.error('❌ Error creating campaign:', error);
      toast({ title: 'Error', description: String(error), variant: 'destructive' });
      setStep(1);
    }
  };

  // Reset
  const resetForm = () => {
    const now = Math.floor(Date.now() / 1000);
    const defaultEndTime = now + (30 * 24 * 60 * 60);
    
    setStep(1);
    setCreatedCampaign(null);
    setCampaignData({
      name: '',
      description: '',
      category: 'Emergency',
      location: '',
      goal: '',
      organizationName: '',
      organizationVerified: false,
      tags: [],
      startTime: now,
      endTime: defaultEndTime
    });
    setImageFiles([]);
    imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    setImagePreviewUrls([]);
  };

  // Loading/Success Screen
  if (step > 1) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-secondary/20 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white border border-border rounded-2xl shadow-lg p-8">
          <div className="text-center space-y-6">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/30 mx-auto">
              {step === 3 ? (
                <CheckCircle2 className="h-10 w-10 text-white" />
              ) : (
                <Loader2 className="h-10 w-10 text-white animate-spin" />
              )}
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-bold">
                {step === 2 && 'Creating Campaign...'}
                {step === 3 && (createdCampaign?.isSafeTransaction 
                  ? 'Transaction Proposed to Safe! 🔐' 
                  : 'Campaign Created Successfully! 🎉')}
              </h2>
              <p className="text-muted-foreground text-lg">
                {step === 2 && 'Submitting to blockchain...'}
                {step === 3 && (createdCampaign?.isSafeTransaction
                  ? `Waiting for ${createdCampaign.requiredSignatures} signature(s) from Safe owners`
                  : 'Your campaign is now live on the blockchain')}
              </p>
            </div>

            {step === 2 && (
              <div className="space-y-2">
                <div className="w-full bg-secondary rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-primary to-primary/80 h-3 rounded-full transition-all duration-300"
                    style={{ width: '100%' }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground font-semibold">
                  Processing transaction...
                </p>
              </div>
            )}

            {step === 3 && createdCampaign && (
              <div className="space-y-3 text-left">
                {/* Success Message */}
                <div className="flex items-start gap-4 p-5 rounded-xl border-2 border-green-500 bg-green-50">
                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-lg mb-1 text-green-900">
                      ✅ Campaign Successfully Submitted
                    </div>
                    <p className="text-sm text-green-800 mb-2">
                      Your campaign has been successfully proposed to the Safe multisig. It will appear in the explorer once all signers approve the transaction.
                    </p>
                    <p className="text-xs text-green-700 font-semibold">
                      ⏳ Status: Pending Multisig Approval
                    </p>
                  </div>
                </div>

                {/* Campaign Details */}
                <div className="flex items-start gap-4 p-5 rounded-xl border border-gray-200 bg-gray-50">
                  <Lock className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-base mb-3 text-gray-900">
                      📋 Campaign Details
                    </div>
                    <div className="space-y-2 text-xs text-gray-700">
                      <p><strong>Campaign Name:</strong> {createdCampaign.campaignTitle}</p>
                      <p><strong>Campaign ID:</strong> <span className="font-mono break-all">{createdCampaign.chainCampaignId.slice(0, 12)}...{createdCampaign.chainCampaignId.slice(-12)}</span></p>
                      <p><strong>Start Time:</strong> {new Date(createdCampaign.chainStartTime * 1000).toLocaleString()}</p>
                      <p><strong>End Time:</strong> {new Date(createdCampaign.chainEndTime * 1000).toLocaleString()}</p>
                      <p><strong>Safe Tx Hash:</strong> <span className="font-mono break-all text-blue-600">{createdCampaign.safeTxHash.slice(0, 12)}...{createdCampaign.safeTxHash.slice(-12)}</span></p>
                    </div>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="flex items-start gap-4 p-5 rounded-xl border border-amber-200 bg-amber-50">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-base mb-2 text-amber-900">
                      📝 Next Steps
                    </div>
                    <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                      <li>Other Safe signers must review and approve this transaction</li>
                      <li>Once approved, your campaign will be visible in the explorer</li>
                      <li>Check the Safe interface using the transaction hash above</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="pt-6 space-y-3">
                <button
                  onClick={() => window.location.href = '/campaigns'}
                  className="w-full bg-gradient-to-r from-primary to-primary/90 text-white hover:shadow-lg hover:shadow-primary/30 rounded-xl h-12 px-6 font-semibold transition-all"
                >
                  View All Campaigns
                </button>
                <button
                  onClick={resetForm}
                  className="w-full border-2 border-border rounded-xl h-12 px-6 font-semibold hover:bg-accent hover:border-primary/30 transition-all"
                >
                  Create Another Campaign
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main Form
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-secondary/20 py-12 px-4">
      {!isHydrated ? (
        <div className="container mx-auto max-w-5xl flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading campaign creation form...</p>
          </div>
        </div>
      ) : (
        <>
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Create a Campaign</h1>
          <p className="text-muted-foreground">
            Set up a new fundraising campaign with transparent, blockchain-verified tracking
          </p>
        </div>

        {/* Connection Status */}
        {!isSigner && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">Safe Signer Required</p>
              <p className="text-sm text-amber-800 mt-1">
                Please connect a Safe signer wallet to create campaigns.
              </p>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white border border-border rounded-lg shadow-sm p-8">
          <div className="space-y-6">
            {/* Campaign Name */}
            <div>
              <label className="block text-sm font-semibold mb-2">Campaign Name</label>
              <input
                type="text"
                placeholder="e.g., Emergency Relief for Flood Victims"
                value={campaignData.name}
                onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              />
              <p className="text-xs text-muted-foreground mt-1">Minimum 10 characters • This identifies your campaign</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold mb-2">Description</label>
              <textarea
                placeholder="Provide details about your campaign, who it helps, and why it matters..."
                value={campaignData.description}
                onChange={(e) => setCampaignData({ ...campaignData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">Minimum 50 characters</p>
            </div>

            {/* Two-column grid for category and location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-semibold mb-2">Category</label>
                <select
                  value={campaignData.category}
                  onChange={(e) => setCampaignData({ ...campaignData, category: e.target.value })}
                  className="w-full px-4 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold mb-2">Location</label>
                <input
                  type="text"
                  placeholder="e.g., Jakarta, Indonesia"
                  value={campaignData.location}
                  onChange={(e) => setCampaignData({ ...campaignData, location: e.target.value })}
                  className="w-full px-4 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                />
              </div>
            </div>

            {/* Funding Goal */}
            <div>
              <label className="block text-sm font-semibold mb-2">Funding Goal (IDRX)</label>
              <input
                type="number"
                placeholder="e.g., 10000"
                value={campaignData.goal}
                onChange={(e) => setCampaignData({ ...campaignData, goal: e.target.value })}
                className="w-full px-4 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              />
              <p className="text-xs text-muted-foreground mt-1">Minimum 1,000 IDRX</p>
            </div>

            {/* Organization Info */}
            <div>
              <label className="block text-sm font-semibold mb-2">Organization Name</label>
              <input
                type="text"
                placeholder="Your organization or nonprofit name"
                value={campaignData.organizationName}
                onChange={(e) => setCampaignData({ ...campaignData, organizationName: e.target.value })}
                className="w-full px-4 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              />
            </div>

            {/* Verified Checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="verified"
                checked={campaignData.organizationVerified}
                onChange={(e) => setCampaignData({ ...campaignData, organizationVerified: e.target.checked })}
                className="w-4 h-4 rounded border-input cursor-pointer"
              />
              <label htmlFor="verified" className="text-sm font-medium cursor-pointer">
                My organization is verified
              </label>
            </div>

            {/* Campaign Duration */}
            <div className="bg-secondary/30 p-4 rounded-lg">
              <p className="text-sm font-semibold mb-4">Campaign Duration</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={dateToLocalString(campaignData.startTime)}
                    onChange={(e) => setCampaignData({ ...campaignData, startTime: localStringToTimestamp(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium mb-2">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={dateToLocalString(campaignData.endTime)}
                    onChange={(e) => setCampaignData({ ...campaignData, endTime: localStringToTimestamp(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Campaign Images */}
            <div>
              <label className="block text-sm font-semibold mb-2">Campaign Images</label>
              <div className="border-2 border-dashed border-input rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-input"
                />
                <label htmlFor="image-input" className="cursor-pointer block">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="font-semibold text-sm">Click to upload images</p>
                  <p className="text-xs text-muted-foreground">Max 5 images, 5MB each</p>
                </label>
              </div>

              {/* Image Previews */}
              {imagePreviewUrls.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
                  {imagePreviewUrls.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img src={url} alt={`Preview ${idx}`} className="w-full h-20 object-cover rounded-lg" />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold mb-2">Tags (Optional)</label>
              <input
                type="text"
                placeholder="e.g., relief, emergency, disaster (comma-separated)"
                value={campaignData.tags.join(', ')}
                onChange={(e) => setCampaignData({ 
                  ...campaignData, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                })}
                className="w-full px-4 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => window.history.back()}
                disabled={isLoading}
                className="flex-1 border border-border rounded-lg h-11 px-4 font-semibold hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isSigner || isLoading}
                className="flex-1 bg-primary text-white hover:bg-primary/90 hover:shadow-lg rounded-lg h-11 px-4 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                title={!isSigner ? 'Please connect a Safe signer wallet first' : ''}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating campaign securely…
                  </>
                ) : (
                  <>
                    Create Campaign
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
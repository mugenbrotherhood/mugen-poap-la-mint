import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import GuardianReveal from "./GuardianReveal";
import MugenSBTABI from "../abi/MugenSBT_ABI.json";
import { getAzukiHeldScore } from "mugen-reputation-sdk";
import '../styles/qr-styles.css';

// Contract addresses & ABIs
const POAP_CONTRACT_ADDRESS = process.env.REACT_APP_POAP_CONTRACT_ADDRESS || "0x9e1373e7A48b9A9F82380bf9b031A81Cbe8a1865";
const POAP_CONTRACT_ABI = [
  "function mint() public",
  "function tokenURI(uint256 tokenId) public view returns (string memory)",
];
const AIRDROP_CONTRACT = process.env.REACT_APP_SBT_CONTRACT_ADDRESS || "0x59BD8cc5e4916844aDe65436AEf8f469CBF57440";
const METADATA_URI = "ipfs://bafkreihxvkbqqj24zw72dmk54ws2f7pdusvo75bigukeh4nttg4tgw2hs4";

export default function MugenPOAPMintPage() {
  // Wallet & signer
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  // POAP state
  const [txStatus, setTxStatus] = useState("");
  const [hasMinted, setHasMinted] = useState(false);
  const [imageURL, setImageURL] = useState(null);
  const [animationURL, setAnimationURL] = useState(null);

  // Eligibility flow state
  const [showEligibilityFlow, setShowEligibilityFlow] = useState(false);
  const [connectedProfiles, setConnectedProfiles] = useState(false);
  const [isEligible, setIsEligible] = useState(false);
  const [airdropped, setAirdropped] = useState(false);

  // QR and mobile state
  const [isQRMode, setIsQRMode] = useState(false);
  const [eventId, setEventId] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  // Detect QR scan and mobile
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const qrParam = urlParams.get('qr');
    const eventIdParam = urlParams.get('eventId');
    const timestamp = urlParams.get('t');

    // Check if user arrived via QR scan
    if (qrParam === 'mobile' && eventIdParam) {
      setIsQRMode(true);
      setEventId(eventIdParam);
      
      // Track QR scan
      const stats = JSON.parse(localStorage.getItem('mugen-qr-stats') || '{}');
      stats.totalScans = (stats.totalScans || 0) + 1;
      stats.lastActivity = new Date().toISOString();
      localStorage.setItem('mugen-qr-stats', JSON.stringify(stats));
    }

    // Detect mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update step based on state
  useEffect(() => {
    if (signer) {
      setCurrentStep(2);
    }
    if (hasMinted) {
      setCurrentStep(3);
    }
    if (airdropped) {
      setCurrentStep(4);
    }
  }, [signer, hasMinted, airdropped]);

  // Connect MetaMask and set signer
  const connectWallet = async () => {
    if (!window.ethereum) {
      if (isQRMode || isMobile) {
        alert("Please install MetaMask mobile app to continue.");
        window.open('https://metamask.app.link/dapp/mugen-poap-mint.vercel.app' + window.location.pathname + window.location.search);
        return;
      }
      return alert("Please install MetaMask.");
    }

    try {
      const _provider = new ethers.BrowserProvider(window.ethereum);
      const _signer = await _provider.getSigner();
      setProvider(_provider);
      setSigner(_signer);
      
      if (isQRMode) {
        setTxStatus("🎉 Wallet connected! Ready to mint your POAP.");
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
      setTxStatus("❌ Failed to connect wallet. Please try again.");
    }
  };

  // Mint POAP on chain
  const mintPOAP = async () => {
    if (!signer) return alert("Connect wallet first.");
    setTxStatus("⏳ Minting in progress...");
    
    try {
      const contract = new ethers.Contract(
        POAP_CONTRACT_ADDRESS,
        POAP_CONTRACT_ABI,
        signer
      );
      const tx = await contract.mint();
      await tx.wait();

      // Fetch metadata
      const uri = "/metadata/0.json";
      setTxStatus("✅ Mint successful! Here's your POAP:");
      setHasMinted(true);
      
      try {
        const metadata = await fetch(uri).then(res => res.json());
        setImageURL(metadata.image);
        setAnimationURL(metadata.animation_url);
      } catch (metadataError) {
        console.warn("Could not fetch metadata:", metadataError);
      }

      // Update mint statistics
      const stats = JSON.parse(localStorage.getItem('mugen-qr-stats') || '{}');
      stats.totalMints = (stats.totalMints || 0) + 1;
      stats.lastActivity = new Date().toISOString();
      localStorage.setItem('mugen-qr-stats', JSON.stringify(stats));

      // Show eligibility flow for QR users
      if (isQRMode) {
        setTimeout(() => setShowEligibilityFlow(true), 2000);
      }
    } catch (err) {
      console.error("Mint Error:", err);
      setTxStatus("❌ Mint failed. Please try again.");
    }
  };

  // Reveal eligibility section
  const handleLearnMore = () => {
    setShowEligibilityFlow(true);
  };

  // Check Azuki holding eligibility via SDK
  const checkEligibility = async () => {
    if (!signer) return;
    const wallet = await signer.getAddress();
    
    try {
      setTxStatus("🔍 Checking your Azuki holdings...");
      const heldScore = await getAzukiHeldScore(wallet);
      setConnectedProfiles(true);
      setIsEligible(heldScore >= 1);
      
      if (heldScore >= 1) {
        setTxStatus("🎉 You're eligible for the special SBT!");
      } else {
        setTxStatus("ℹ️ You need at least 1 Azuki NFT to be eligible for the SBT.");
      }
    } catch (err) {
      console.error("Eligibility check error:", err);
      setConnectedProfiles(true);
      setIsEligible(false);
      setTxStatus("⚠️ Could not verify Azuki holdings. You can still try to claim the SBT.");
    }
  };

  // Airdrop SBT via contract
  const handleAirdrop = async () => {
    if (!signer) return;
    const wallet = await signer.getAddress();
    
    try {
      setTxStatus("⏳ Claiming your SBT...");
      const contract = new ethers.Contract(
        AIRDROP_CONTRACT,
        MugenSBTABI,
        signer
      );
      const tx = await contract.mint(wallet, METADATA_URI);
      await tx.wait();
      setAirdropped(true);
      setTxStatus("✅ SBT successfully claimed and added to your wallet!");
      
      if (isQRMode) {
        alert("🎉 Congratulations! You've completed the full Mugen POAP experience!");
      }
    } catch (err) {
      console.error("Airdrop Error:", err);
      setTxStatus("❌ SBT claim failed. You may not be eligible or have already claimed.");
    }
  };

  // Render mobile/QR optimized interface
  if (isQRMode || isMobile) {
    return (
      <div className="qr-page">
        <div className="mobile-interface">
          <div className="mobile-header">
            <h1 className="mobile-title">Mugen POAP</h1>
            <p className="mobile-subtitle">
              {eventId ? `Event: ${eventId}` : 'Mint your exclusive POAP'}
            </p>
            {isQRMode && (
              <div className="status-indicator connected">
                <div className="status-dot"></div>
                Arrived via QR scan
              </div>
            )}
          </div>

          <div className="mobile-steps">
            {/* Step 1: Connect Wallet */}
            <div className={`mobile-step ${currentStep >= 1 ? 'active' : ''} ${signer ? 'completed' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-title">Connect Your Wallet</div>
              <div className="step-description">
                Connect your MetaMask wallet to get started
              </div>
              <div className="step-action">
                {!signer ? (
                  <button className="mobile-button" onClick={connectWallet}>
                    Connect MetaMask
                  </button>
                ) : (
                  <div className="status-indicator connected">
                    <div className="status-dot"></div>
                    Wallet Connected
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Mint POAP */}
            <div className={`mobile-step ${currentStep >= 2 ? 'active' : ''} ${hasMinted ? 'completed' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-title">Mint Your POAP</div>
              <div className="step-description">
                Claim your proof of attendance NFT
              </div>
              <div className="step-action">
                {!hasMinted ? (
                  <button 
                    className="mobile-button" 
                    onClick={mintPOAP}
                    disabled={!signer}
                  >
                    Mint POAP
                  </button>
                ) : (
                  <div className="status-indicator connected">
                    <div className="status-dot"></div>
                    POAP Minted Successfully
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Check Eligibility */}
            <div className={`mobile-step ${currentStep >= 3 ? 'active' : ''} ${connectedProfiles ? 'completed' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-title">Check SBT Eligibility</div>
              <div className="step-description">
                See if you qualify for the special Soulbound Token
              </div>
              <div className="step-action">
                {!connectedProfiles ? (
                  <button 
                    className="mobile-button" 
                    onClick={checkEligibility}
                    disabled={!hasMinted}
                  >
                    Check Eligibility
                  </button>
                ) : (
                  <div className={`status-indicator ${isEligible ? 'connected' : 'disconnected'}`}>
                    <div className="status-dot"></div>
                    {isEligible ? 'Eligible for SBT' : 'Not Eligible'}
                  </div>
                )}
              </div>
            </div>

            {/* Step 4: Claim SBT */}
            {connectedProfiles && isEligible && (
              <div className={`mobile-step ${currentStep >= 4 ? 'active' : ''} ${airdropped ? 'completed' : ''}`}>
                <div className="step-number">4</div>
                <div className="step-title">Claim Your SBT</div>
                <div className="step-description">
                  Claim your exclusive Soulbound Token
                </div>
                <div className="step-action">
                  {!airdropped ? (
                    <button 
                      className="mobile-button" 
                      onClick={handleAirdrop}
                    >
                      Claim SBT
                    </button>
                  ) : (
                    <div className="status-indicator connected">
                      <div className="status-dot"></div>
                      SBT Claimed Successfully
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Status Display */}
          {txStatus && (
            <div className="dashboard-card" style={{ marginTop: '20px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '1rem' }}>{txStatus}</p>
            </div>
          )}

          {/* POAP Image Display */}
          {imageURL && (
            <div className="dashboard-card" style={{ marginTop: '20px', textAlign: 'center' }}>
              <h3 className="card-title">Your POAP</h3>
              <img 
                src={imageURL} 
                alt="Your POAP" 
                style={{ 
                  maxWidth: '200px', 
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}
              />
            </div>
          )}

          {/* Guardian Reveal for completed users */}
          {airdropped && <GuardianReveal />}
        </div>
      </div>
    );
  }

  // Default desktop interface
  return (
    <div className="mint-page">
      <button onClick={connectWallet}>Connect Wallet</button>

      {/* POAP Mint Section */}
      <section>
        <h2>POAP Mint</h2>
        {hasMinted ? (
          <div>
            <p>{txStatus}</p>
            {imageURL && <img src={imageURL} alt="POAP" />}
          </div>
        ) : (
          <div>
            <p>{txStatus}</p>
            <button onClick={mintPOAP}>Mint POAP</button>
          </div>
        )}
      </section>

      {/* Learn More / Eligibility Trigger */}
      {hasMinted && !showEligibilityFlow && (
        <section>
          <h2>Next: Learn About Mugen</h2>
          <button onClick={handleLearnMore}>Learn More & Check Eligibility</button>
        </section>
      )}

      {/* Eligibility Section */}
      {showEligibilityFlow && (
        <section>
          <h2>Eligibility</h2>
          {connectedProfiles ? (
            <p>{isEligible ? "✅ Eligible for SBT mint" : "❌ Not eligible"}</p>
          ) : (
            <button onClick={checkEligibility}>Check Azuki Eligibility</button>
          )}
        </section>
      )}

      {/* SBT Airdrop Section */}
      {showEligibilityFlow && (
        <section>
          <h2>SBT Airdrop</h2>
          <button onClick={handleAirdrop} disabled={!isEligible || airdropped}>
            {airdropped ? "Airdropped" : "Claim SBT"}
          </button>
        </section>
      )}

      <GuardianReveal />
    </div>
  );
}

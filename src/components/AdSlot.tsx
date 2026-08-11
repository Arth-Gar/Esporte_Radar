import React, { useEffect, useState } from 'react';

declare global {
  interface Window {
    googletag: any;
  }
}

interface AdSlotProps {
  adUnit: string;
  sizes: any;
  id: string;
  label?: string;
  className?: string;
}

/**
 * Standard inline Google Ad Manager slot component
 */
export const AdSlot: React.FC<AdSlotProps> = ({ adUnit, sizes, id, label = "Publicidade", className }) => {
  const [isEmpty, setIsEmpty] = useState(false);

  useEffect(() => {
    window.googletag = window.googletag || { cmd: [] };
    let slot: any = null;

    window.googletag.cmd.push(() => {
      // Configure collapse empty divs globally for GAM
      window.googletag.pubads().collapseEmptyDivs();

      // Listen for slot render finished event to hide wrapper if no ad returned
      window.googletag.pubads().addEventListener('slotRenderEnded', (event: any) => {
        if (event.slot === slot && event.isEmpty) {
          setIsEmpty(true);
        }
      });

      // Define the slot with width/height and HTML div target ID
      slot = window.googletag.defineSlot(adUnit, sizes, id);
      
      if (slot) {
        // Apply custom targeting parameters to trace with the Ad Exchange
        slot.setTargeting('adx_pub_id', 'ca-pub-6786401860837559');
        slot.addService(window.googletag.pubads());
        
        // Display the ad inside the div
        window.googletag.display(id);
      }
      
      // Enable services
      window.googletag.enableServices();
    });

    // Destroy the slot on component unmount to prevent memory leaks and warning logs
    return () => {
      window.googletag.cmd.push(() => {
        if (slot) {
          window.googletag.destroySlots([slot]);
        }
      });
    };
  }, [adUnit, id, JSON.stringify(sizes)]);

  if (isEmpty) {
    return null;
  }

  return (
    <div className={`w-full flex flex-col items-center justify-center p-2.5 my-3 bg-[#0a2e1e]/30 border border-green-900/20 rounded-lg ${className || ''}`}>
      <span className="text-[8px] font-mono tracking-widest text-green-600/80 uppercase mb-1.5 select-none">
        {label}
      </span>
      <div 
        id={id} 
        className="bg-black/10 rounded flex items-center justify-center overflow-hidden border border-green-950/40" 
        style={{ minWidth: '320px', minHeight: '50px' }} 
      />
    </div>
  );
};

/**
 * Hook to automatically register and manage a sticky bottom anchor ad
 */
export const useAnchorAd = (adUnit: string) => {
  useEffect(() => {
    window.googletag = window.googletag || { cmd: [] };
    let anchorSlot: any = null;

    window.googletag.cmd.push(() => {
      window.googletag.pubads().collapseEmptyDivs();

      // Google Publisher Tag native bottom anchor layout format
      anchorSlot = window.googletag.defineOutOfPageSlot(
        adUnit,
        window.googletag.enums.OutOfPageFormat.BOTTOM_ANCHOR
      );

      if (anchorSlot) {
        anchorSlot.setTargeting('adx_pub_id', 'ca-pub-6786401860837559');
        anchorSlot.addService(window.googletag.pubads());
        window.googletag.display(anchorSlot);
      }
      
      window.googletag.enableServices();
    });

    return () => {
      window.googletag.cmd.push(() => {
        if (anchorSlot) {
          window.googletag.destroySlots([anchorSlot]);
        }
      });
    };
  }, [adUnit]);
};

import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { requestReward } from "./adService";
import type { RewardOffer, RewardOutcome } from "./adService";

interface RewardedApi {
  /** Meminta hadiah. Selesai dengan "granted" hanya jika iklan benar-benar ditonton. */
  request: (placement: string, description: string) => Promise<RewardOutcome>;
  /** True selama permintaan atau iklan berlangsung (mis. untuk menjeda timer). */
  busy: boolean;
  /** Dialog persetujuan. Wajib dirender oleh pemakai hook. */
  dialog: ReactNode;
}

export function useRewarded(): RewardedApi {
  const [offer, setOffer] = useState<RewardOffer | null>(null);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const request = useCallback(
    async (placement: string, text: string): Promise<RewardOutcome> => {
      setBusy(true);
      setDescription(text);
      const outcome = await requestReward(placement, (next) => setOffer(next));
      setOffer(null);
      setBusy(false);
      return outcome;
    },
    [],
  );

  const accept = () => {
    if (!offer) return;
    const current = offer;
    setOffer(null);
    current.show();
  };

  const decline = () => {
    if (!offer) return;
    const current = offer;
    setOffer(null);
    current.decline();
  };

  const dialog = (
    <Modal
      open={offer !== null}
      title="Watch a short ad?"
      onClose={decline}
      actions={
        <>
          <Button onClick={accept}>Watch ad</Button>
          <Button variant="dark" onClick={decline}>
            Not now
          </Button>
        </>
      }
    >
      {description}
      {offer?.simulated ? " (Development mode: no real ad is shown.)" : ""}
    </Modal>
  );

  return { request, busy, dialog };
}
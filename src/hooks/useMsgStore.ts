import { create } from 'zustand';
import type { MsgStore } from '../../types/hikar';

export const useMsgStore = create<MsgStore>((set) => ({
    loadingMsg: "",
    statusMsg: "",
    setLoadingMsg: (loadingMsg: string) => set(() => ({ loadingMsg })),
    setStatusMsg: (statusMsg: string) => set(() => ({ statusMsg }))
}));

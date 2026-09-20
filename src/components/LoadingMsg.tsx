
import { useMsgStore } from '../hooks/useMsgStore';

export default function LoadingMsg() {
    const loadingMsg = useMsgStore((state) => state.loadingMsg);
    return (loadingMsg == "" ?
        "" :
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0)',
            width: "100%",
            position: "absolute",
            top: "0px",
            left: "0px",
            zIndex: 2
        }}>
            <h1 style={{ color: 'white' }}>{loadingMsg}</h1>
        </div>
    )
}
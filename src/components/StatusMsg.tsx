import { useMsgStore  } from '../hooks/useMsgStore';

export default function StatusMsg() {
    const statusMsg = useMsgStore((state) => state.statusMsg);
    return (
        <div style={{ width: '100%', height: '100%', position: 'absolute', top: '0px', left: '0px', display: 'flex', flexDirection: 'column', justifyContent: 'end' }}>
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', width: '100%', backgroundColor: 'blue', color: 'white' }}>{statusMsg}</div>
        </div>
    );
}
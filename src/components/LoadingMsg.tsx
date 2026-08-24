
interface LoadingMsgProps {
    message: string;
}

export default function LoadingMsg({ message } : LoadingMsgProps) {
    return(
        <div style={{
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center', 
            fontSize: '200%',
            backgroundColor: 'rgba(255, 255, 255, 0)',
            width: "100%",  
            position: "absolute",
            top: "0px",
            left: "0px",
            zIndex: 2
        }}>
            <h1 style={{ color: 'rgba(192, 192, 255, 1)' }}>{ message }</h1>
        </div>
    )
}
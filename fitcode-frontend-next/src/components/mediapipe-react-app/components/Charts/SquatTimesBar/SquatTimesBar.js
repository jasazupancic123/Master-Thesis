import './SquatTimesBar.css'

export const SquatTimesBar = ({ downTime, upTime }) => {
    const totalTime = downTime + upTime;
    const downTimeWidth = (downTime / totalTime) * 100;
    const upTimeWidth = (upTime / totalTime) * 100;

    return (
        <div className="squat-times-bar-container" style={{ '--downTimeWidth': downTimeWidth, '--upTimeWidth': upTimeWidth }}>
            <div className="down-time">
                {downTime} ms
            </div>
            <div className="up-time">
                {upTime} ms
            </div>
        </div>
    );
};

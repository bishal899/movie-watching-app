import './People.css'
import { FaUserCircle } from "react-icons/fa";

export default function People({ username, status }) {
    return (
        <div className="people">
            <FaUserCircle className='user' size={18} />
            <p>{username}
                <span>{status}</span>
            </p>
        </div>
    )
}
import './Aside.css'
import PeopleSection from './PeopleSection'
import ChatSection from './ChatSection'
import { LuPanelLeftClose } from "react-icons/lu";
import { useContext, useState } from 'react';
import { UserContext } from '../../UserContext';

export default function Aside() {
    const usersContext = useContext(UserContext)
    const username = usersContext.username
    const [active, setActive] = useState(true)
    return (
        <aside className="side-panel">
            <div className="heading">
                <p>{username}</p>
                <LuPanelLeftClose className={`left-button ${active ? 'active' : ''}`} size={20} onClick={() => setActive(!active)} />
            </div>
            {
                !active && 
                <div className="divider">
                    <PeopleSection />
                    <ChatSection />
                </div>
            }
            
        </aside>
    )
}

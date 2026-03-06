import './Aside.css'
import PeopleSection from './PeopleSection'
import ChatSection from './ChatSection'
import { LuPanelLeftClose } from "react-icons/lu";
import { useContext, useState } from 'react';
import { UserContext } from '../../UserContext';

export default function Aside() {
    const { username } = useContext(UserContext)
    // `open` tracks whether the panel is expanded. default true so users see the sections.
    const [open, setOpen] = useState(true)

    return (
        <aside className={`aside-panel ${open ? 'open' : 'collapsed'}`}>
            <div className="heading">
                {/* hide the name when collapsed to save space */}
                {open && <p>{username}</p>}
                <LuPanelLeftClose
                    className={`toggle-btn ${open ? '' : 'rotated'}`}
                    size={20}
                    onClick={() => setOpen(o => !o)}
                />
            </div>

            {open && (
                <div className="divider">
                    <PeopleSection />
                    <ChatSection />
                </div>
            )}
        </aside>
    )
}

import './PeopleSection.css'
import { FaAngleDown } from "react-icons/fa6";
import { useContext } from 'react';
import { UserContext } from '../../UserContext';
import People from './People';

function PeopleSection() {
    const userProps = useContext(UserContext)
    const users = userProps.users

    // useEffect(() => {
    //     setUsers(prev => [...prev, username])
    // }, [username])

    return (
        <div className="people-section">
            <div className="heading">
                <p>people</p>
                <FaAngleDown />
            </div>
            <div className="people-container">
                {
                    users.map((user, i) => (
                        <People key={i} username={user.username} status={user.memberStatus} />
                    ))
                }
            </div>
        </div>
    )
}

export default PeopleSection
import './InputForm.css'
import { FaArrowRight } from "react-icons/fa6";

function InputForm({ handleChange, activeBox }) {
    return (
        <div className="input-form-section">

            {/* 
            <div className="url">
                <h3>paste your URL</h3>
                <div className="input-container">
                    <input type="text" placeholder='enter URL here' value={inputText} onChange={handleChange} />
                    <button onClick={activeBox}><FaArrowRight size={20} /></button>
                </div>
            </div>or 
            */}
            
            <div className="file">
                <h3>choose file</h3>
                <div className="input-container">
                    <input type="file" placeholder='enter URL here' onChange={handleChange} />
                    <button onClick={activeBox}><FaArrowRight size={20} /></button>
                </div>
            </div>
        </div>
    )
}

export default InputForm
import './InputForm.css'
import { FaArrowRight } from "react-icons/fa6";
import { useState } from 'react';

function InputForm({ handleChange, activeBox }) {
    const [fileName, setFileName] = useState('choose file')

    const handleFileChange = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            setFileName(file.name.length > 35 ? file.name.slice(0, 32) + '...' : file.name)
        } else {
            setFileName('choose file')
        }
        handleChange(e)
    }

    return (
        <div className="input-form-section">
            <div className="file">
                <h3>choose file</h3>
                <div className="input-container">
                    <label htmlFor="file-input">{fileName}</label>
                    <input
                        id="file-input"
                        type="file"
                        onChange={handleFileChange}
                    />
                    <button onClick={activeBox}>
                        <FaArrowRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default InputForm
import React, { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './PageTwo.css';
import logo from './aura-black-logo.png';

function PageTwo() {
    const [client, setClient] = useState({
        name: '',
        contact: '',
        city: '',
        area: '',
        descript: ''
    });

    const [serialNoInv, setSerialNoInv] = useState('');
    const previewRef = useRef();
    const [isCompleteSet, setIsCompleteSet] = useState(false);

    // Generate serial number on component mount
    useEffect(() => {
        const now = new Date();
        const yy = now.getFullYear().toString().slice(2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const key = `invoice-serial-${yy}${mm}`;

        let count = parseInt(localStorage.getItem(key));
        if (isNaN(count)) {
            count = 1;
            localStorage.setItem(key, count); // Save initial value
        }

        const newSerialInv = `${yy}${mm}${String(count).padStart(3, '0')}`;
        setSerialNoInv(newSerialInv);
    }, []);

    const handleChange = (e) => {
        setClient({ ...client, [e.target.name]: e.target.value });
    };

    const handleSerialChange = (e) => {
        setSerialNoInv(e.target.value);
    };

    const [setItems, setSetItems] = useState([
        { name: 'Planning', amount: '' },
        { name: 'Elevation', amount: '' },
        { name: 'Structural', amount: '' },
        { name: 'EPD', amount: '' },
        { name: 'Interior', amount: '' }
    ]);

    const addCustomSet = () => {
        const name = prompt('Enter name of new set:');
        if (name) {
            setSetItems([...setItems, { name, amount: '' }]);
        }
    };

    const coreSets = ['Planning', 'Elevation', 'Structural', 'EPD'];
    const coreSetCount = setItems.filter(item => coreSets.includes(item.name)).length;
    const isCoreSetComplete = isCompleteSet && coreSetCount === coreSets.length;

    // Calculate total for core sets only once:
    const coreSetTotal = isCompleteSet
    ? (isCoreSetComplete ? (parseFloat(client.area) * 25 || 0) : 0)
    : setItems
        .filter(item => coreSets.includes(item.name))
        .reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);

    const otherSetsTotal = setItems
    .filter(item => !coreSets.includes(item.name))
    .reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);

    const totalCost = coreSetTotal + otherSetsTotal;

    // --- UPDATED PRINT FUNCTION ---
    const handlePrint = async () => {
        const element = previewRef.current;
        const clientName = client.name.trim().replace(/\s+/g, '_') || 'Client';

        // 1. Capture at Scale 2 (Good balance of quality vs size)
        const canvas = await html2canvas(element, {
            scale: 3, // 2 is usually enough for clear text. Use 3 if you need it sharper.
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff' // Crucial for JPEG to avoid black backgrounds
        });

        // 2. Convert to JPEG with 0.75 (75%) quality
        const imgData = canvas.toDataURL('image/jpeg', 0.75);

        // 3. Create PDF with compression enabled
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
            compress: true
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

        // Add image as JPEG
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight);
        
        pdf.save(`invoice_${clientName}_${serialNoInv}.pdf`);

        // Increment serial counter logic (same as before)
        const yy = serialNoInv.slice(0, 2);
        const mm = serialNoInv.slice(2, 4);
        const key = `invoice-serial-${yy}${mm}`;
        let CurrentCountInv = parseInt(localStorage.getItem(key)) || 1;
        localStorage.setItem(key, CurrentCountInv + 1);
        const nextSerial = `${yy}${mm}${String(CurrentCountInv + 1).padStart(3, '0')}`;
        setSerialNoInv(nextSerial);
    };

    return (
        <div className="quotation-container">
            <div className="left-form">
                <h3>Client Details</h3>
                <input name="serial" placeholder="Serial No" value={serialNoInv} onChange={handleSerialChange} />
                <input name="name" placeholder="Name" value={client.name} onChange={handleChange} />
                <input name="contact" placeholder="Contact" value={client.contact} onChange={handleChange} />
                <input name="city" placeholder="City" value={client.city} onChange={handleChange} />
                <input name="area" placeholder="Area" value={client.area} onChange={handleChange} />
                <input name="descript" placeholder="Description" value={client.descript} onChange={handleChange} />
                
                {/* Complete Set Radio Option */}
                <div className="complete-set-section">
                    <label>
                        <input
                            type="radio"
                            name="setOption"
                            checked={isCompleteSet}
                            onChange={() => setIsCompleteSet(true)}
                        />
                        Complete Set
                    </label>
                    <label style={{ marginLeft: '20px' }}>
                        <input
                            type="radio"
                            name="setOption"
                            checked={!isCompleteSet}
                            onChange={() => setIsCompleteSet(false)}
                        />
                        Custom Set
                    </label>
                </div>

                {/* Purchased Sets */}
                <div className="set-section">
                    <h3>Purchased Sets</h3>
                        {setItems.map((item, index) => {
                        const isCoreSet = coreSets.includes(item.name);
                        const isAutoFilled = isCompleteSet && isCoreSet;

                        // If core set auto-filled, skip input display (no delete button needed)
                        if (isAutoFilled) return null;

                        return (
                            <div key={index} className="set-input" style={{ display: 'flex', alignItems: 'center' }}>
                                <label style={{ flex: 1 }}>{item.name}</label>
                            <input
                                type="number"
                                value={item.amount}
                                onChange={(e) => {
                                    const updatedItems = [...setItems];
                                    updatedItems[index].amount = e.target.value;
                                    setSetItems(updatedItems);
                                }}
                                placeholder="Amount ₹"
                                    style={{ width: '100px', marginRight: '10px' }}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    // Remove this set from state
                                    const updatedItems = setItems.filter((_, i) => i !== index);
                                    setSetItems(updatedItems);
                                }}
                                style={{ backgroundColor: 'red', color: 'white', border: 'none', padding: '4px 8px', cursor: 'pointer' }}
                                title="Delete this set"
                                >
                                Delete
                            </button>
                        </div>
                        );
                    })}
                </div>

                <button className="add-set-button" onClick={addCustomSet}>+ Add Set</button>
                <button className="print-pdf-button" onClick={handlePrint}>Print to PDF</button>
            </div>

            <div className="right-preview" ref={previewRef}>
                <h2 className='Qname'>Invoice</h2><br/>
                <div className='header-row'>
                    <div className='logo'>
                        <img src={logo} alt="Company Logo" style={{ width: '120px', marginBottom: '10px' }} />
                    </div>
                    <div className='details'>
                        <p><strong>Serial No:</strong> {serialNoInv || '—'}</p>
                        <p><strong>Name:</strong> {client.name || '—'}</p>
                        <p><strong>Contact:</strong> {client.contact || '—'}</p>
                        <p><strong>City:</strong> {client.city || '—'}</p>
                        <p><strong>Area:</strong> {client.area || '—'}</p>
                        <p><strong>Description:</strong> {client.descript || '—'}</p>
                    </div>
                </div>
                <h3 className='sets-table-heading'>Set Details</h3>
                <table className="sets-table">
                    <thead>
                        <tr>
                            <th>Sr.</th>
                            <th>Set</th>
                            <th>Amount (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {setItems.map((item, idx) => (
                            <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td>{item.name}</td>
                                <td>{item.amount || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan="2"><strong>Total</strong></td>
                            <td><strong>₹ {totalCost.toFixed(2)}</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

export default PageTwo;


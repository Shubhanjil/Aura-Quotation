// PageOne.js
import React, { useState, useRef, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import './PageOne.css';
import logo from './aura-black-logo.png';

function PageOne() {
    const [client, setClient] = useState({
        name: '',
        contact: '',
        city: '',
        area: '',
        descript: ''
    });

    const [serialNoQuot, setSerialNoQuotQuot] = useState('');
    const previewRef = useRef();
    const [isCompleteSet, setIsCompleteSet] = useState(false);
    const [extraTerms, setExtraTerms] = useState("");

    // Generate serial number on component mount
    useEffect(() => {
        const now = new Date();
        const yy = now.getFullYear().toString().slice(2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const key = `quotation-serial-${yy}${mm}`;

        // Try to get the count for this month
        let count = parseInt(localStorage.getItem(key));
        if (isNaN(count)) {
            count = 1;
            localStorage.setItem(key, count);
        }

        const newSerialQuot = `${yy}${mm}${String(count).padStart(3, '0')}`;
        setSerialNoQuotQuot(newSerialQuot);
    }, []);

    const handleChange = (e) => {
        setClient({ ...client, [e.target.name]: e.target.value });
    };

    const handleSerialChange = (e) => {
        setSerialNoQuotQuot(e.target.value);
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

    const handlePrint = () => {
        const element = previewRef.current;
        const clientName = client.name.trim().replace(/\s+/g, '_') || 'Client';

        const opt = {
            margin: 0.5,
            filename: `quotation_${clientName}_${serialNoQuot}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();

        // Increment serial counter in localStorage
        const yy = serialNoQuot.slice(0, 2);
        const mm = serialNoQuot.slice(2, 4);
        const key = `invoice-serial-${yy}${mm}`;
        let currentCount = parseInt(localStorage.getItem(key)) || 1;
        localStorage.setItem(key, currentCount + 1);
        const nextSerial = `${yy}${mm}${String(currentCount + 1).padStart(3, '0')}`;
        setSerialNoQuotQuot(nextSerial);
    };

    // === NEW: compute selected sets & display text for the preview ===
    const interiorItem = setItems.find(i => i.name === 'Interior');
    const hasInteriorAmount = interiorItem && parseFloat(interiorItem.amount) > 0;

    let selectedSets = [];
    if (isCompleteSet) {
        // Complete set includes core phases always
        selectedSets = [...coreSets];
        if (hasInteriorAmount) selectedSets.push('Interior');
    } else {
        // Custom: include only sets that have an entered amount > 0
        selectedSets = setItems
            .filter(i => parseFloat(i.amount) > 0)
            .map(i => i.name);
    }

    const chosenSetsText = isCompleteSet
        ? (hasInteriorAmount ? 'Complete Set + Interior' : 'Complete Set')
        : (selectedSets.length ? selectedSets.join(', ') : '—');

    // Prepare table rows for preview based on chosen mode
    const tableRows = isCompleteSet
        ? (() => {
            const rows = [];
            // Complete Set row represents the 4 core phases
            rows.push({ name: 'Complete Set', amount: coreSetTotal });
            // Add other (non-core) sets if they have amounts (e.g., Interior or custom sets)
            setItems.forEach(item => {
                if (!coreSets.includes(item.name) && parseFloat(item.amount) > 0) {
                    rows.push({ name: item.name, amount: parseFloat(item.amount) });
                }
            });
            return rows;
        })()
        : setItems
            .filter(item => parseFloat(item.amount) > 0)
            .map(item => ({ name: item.name, amount: parseFloat(item.amount) }));

    return (
        <div className="quotation-container">
            <div className="left-form">
                <h3>Client Details</h3>
                <input name="serial" placeholder="Serial No" value={serialNoQuot} onChange={handleSerialChange} />
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

                        if (isAutoFilled) return null; // hide core inputs when Complete Set selected

                        return (
                            <div key={index} className="set-input" style={{ display: 'flex', alignItems: 'center' }}>
                                <label style={{ flex: 1 }}>{item.name}</label>
                                <input
                                    type="number"
                                    value={item.amount}
                                    onChange={(e) => {
                                        const updatedItems = [...setItems];
                                        updatedItems[index] = { ...updatedItems[index], amount: e.target.value };
                                        setSetItems(updatedItems);
                                    }}
                                    placeholder="Amount ₹"
                                    style={{ width: '100px', marginRight: '10px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
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
                <textarea
                    className="border rounded-md w-full p-2 mt-3 text-sm"
                    rows={3}
                    placeholder="Add extra terms and conditions..."
                    value={extraTerms}
                    onChange={(e) => setExtraTerms(e.target.value)}
                ></textarea>    
                <button className="print-pdf-button" onClick={handlePrint}>Print to PDF</button>
            </div>

            <div className="right-preview" ref={previewRef}>
                <h2 className='Qname'>Quotation</h2><br />
                <div className='logo'>
                    <img src={logo} alt="Company Logo" style={{ width: '120px', marginBottom: '10px' }} />
                </div>
                <div className='details'>
                    <p><strong>Serial No:</strong> {serialNoQuot || '—'}</p>
                    <p><strong>Name:</strong> {client.name || '—'}</p>
                    <p><strong>Contact:</strong> {client.contact || '—'}</p>
                    <p><strong>City:</strong> {client.city || '—'}</p>
                </div>
                <div className='hellomsg'>
                        <p><em><strong>Aura Designs</strong> is delighted to present this proposal to <strong>{client.name || 'the client'}</strong>.
                            We believe it will suit your requirements well and provide the value you are looking for.</em></p>
                        <p>As per our discussion, please find attached the quotation for the design with all necessary details</p>
                        <p><strong>Description:</strong> {client.descript || '—'}</p>
                        <p><strong>Area:</strong> {client.area || '—'} sqft.</p>
                        <p><strong>Chosen Sets:</strong> {chosenSetsText || '—'}</p>
                </div>

                <div className="phases-container">
                    {/* Render phases conditionally based on selectedSets */}
                    {selectedSets.includes('Planning') && (
                        <div className="phase">
                            <h3>Phase 1: Architectural Planning & Design</h3>
                            <ul>
                                <li><strong>Customized Floor Plan with Concept Development:</strong> Functional, aesthetic layouts tailored to your needs and vision.</li>
                                <li><strong>Spatial Orientation Consultation (Vastu):</strong> Guidance to align your building spiritually, culturally, or traditionally.</li>
                                <li><strong>Natural Light & Cross-Ventilation Optimization:</strong> Ensuring healthy living with proper airflow and sunlight access.</li>
                                <li><strong>2D Furniture & Interior Layout Planning:</strong> Furniture placement for space efficiency and flow.</li>
                            </ul>
                        </div>
                    )}

                    {selectedSets.includes('Elevation') && (
                        <div className="phase">
                            <h3>Phase 2: Elevation Design</h3>
                            <ul>
                                <li><strong>3D Elevation Views (Front, Side & Rear):</strong> Scaled 3D visuals showcasing exterior appearance.</li>
                                <li><strong>2D Working Drawings & Details:</strong> Technical elevation drawings with precise measurements.</li>
                                <li><strong>Material & Texture Recommendations:</strong> Suggestions for exterior finishes and facade treatments.</li>
                            </ul>
                        </div>
                    )}

                    {selectedSets.includes('Structural') && (
                        <div className="phase">
                            <h3>Phase 3: Structural Design & Documentation</h3>
                            <ul>
                                <li><strong>Structural Layouts (Columns, Beams & Centerlines):</strong> Comprehensive plans for column positioning, beam placements.</li>
                                <li><strong>Foundation & Footing Details:</strong> Detailed RCC foundation and footing designs adapted to soil conditions.</li>
                                <li><strong>Framing & Load Distribution Plan:</strong> Integrated structural framework including load paths.</li>
                                <li><strong>Slab, Lintel & Roof Plans:</strong> Reinforced slab layouts, lintel designs, and structural detailing.</li>
                                <li><strong>Architectural Elements Detailing:</strong> Specialized drawings for towers, domes, and other features.</li>
                                <li><strong>Execution Notes & Contractor Guidelines:</strong> Site instructions and best practices for implementation.</li>
                            </ul>
                        </div>
                    )}

                    {selectedSets.includes('EPD') && (
                        <div className="phase">
                            <h3>Phase 4: Electrical & Plumbing Design (EPD)</h3>
                            <ul>
                                <li><strong>Electrical Layout:</strong> Complete plan showing lighting points, switches, and circuits.</li>
                                <li><strong>Plumbing Layout:</strong> Water supply system and sanitary fixture positioning.</li>
                                <li><strong>Drainage & Rainwater Management:</strong> Design for drainage systems and rainwater harvesting.</li>
                            </ul>
                        </div>
                    )}

                    {selectedSets.includes('Interior') && (
                        <div className="phase">
                            <h3>Phase 5: Interior Design</h3>
                            <ul>
                                <li><strong>2D Interior Layout:</strong> Room-wise space planning including furniture placement.</li>
                                <li><strong>Concept Mood Boards:</strong> Visual guides for themes, colors, and styles.</li>
                                <li><strong>False Ceiling & Lighting Plans:</strong> Design for ambient, task, and accent lighting.</li>
                                <li><strong>Modular Suggestions (Kitchen, Wardrobe, Storage):</strong> Design proposals for modular fittings.</li>
                            </ul>
                        </div>
                    )}
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
                        {tableRows.map((row, idx) => (
                            <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td>{row.name}</td>
                                <td>{row.amount ? row.amount.toFixed(2) : '—'}</td>
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
                <div className="terms_cond_cont">
                    <h2 className="terms_and_cond_line"><strong>Terms and Conditions:</strong></h2>
                    <ul className="list_of_terms">
                        <li>50% advance amount in all cases.</li>
                        <li>30% after 1st draft delivery.</li>
                        <li>20% after finalization of draft.</li>

                        {isCompleteSet && (
                            <li>If client asks for changes for finalized phase, extra charges will be applicable.</li>
                        )}

                        {selectedSets.includes('Interior') || selectedSets.includes('Elevation' && !isCompleteSet) && (
                            <li>Charges will be applicable after any changes in plan after the first draft is prepared.</li>
                        )}

                        {selectedSets.includes('Interior') && selectedSets.includes('Elevation') && (
                            <li>Charges will be applicable after any changes in plan after the first draft is prepared.</li>
                        )}
                        {extraTerms && (<li>{extraTerms}</li>)}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default PageOne;

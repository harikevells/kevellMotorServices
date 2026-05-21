import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Table, Form } from 'react-bootstrap';
import { Search, Plus, Trash2, Printer, Send, X, Check } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './Challen.css';

// Reuse the Logo from assets if needed, or use a placeholder
import logoPdf from '../../assets/logopdf.png';

const InvoiceContent = ({ selectedBooking, customerName, vehicleNumber, vehicleDetails, spareParts, laborCharges, calculateSubTotal, calculateTotal }) => (
    <div className="bill-paper shadow-sm">
        <div className="bill-header">
            <div className="brand-section">
                <img src={logoPdf} alt="Logo" className="bill-logo" />
                <h2 className="vendor-name">{selectedBooking?.vendorDetails?.shopName || 'Kevell Motor Services'}</h2>
                <p className="vendor-info">
                    {selectedBooking?.vendorDetails?.address || '123 Service Road, Madurai'}<br/>
                    Phone: {selectedBooking?.vendorDetails?.phone || '+91 98765 43210'}<br/>
                    Email: {selectedBooking?.vendorDetails?.email || 'support@kevell.com'}
                </p>
            </div>
            <div className="invoice-meta text-end">
                <h1 className="invoice-title">INVOICE</h1>
                <p className="invoice-ref"># {selectedBooking?.bookingRef || 'INV-000000'}</p>
                <div className="balance-due">
                    <span className="label">Balance Due</span>
                    <h3 className="amount">₹{calculateTotal()}</h3>
                </div>
            </div>
        </div>

        <div className="bill-details-grid">
            <div className="bill-to">
                <span className="section-label">Bill To</span>
                <h4 className="customer-name">{customerName || 'N/A'}</h4>
                <p className="customer-info">
                    Phone: {selectedBooking?.userDetails?.phone || 'N/A'}<br/>
                    Address: {selectedBooking?.userDetails?.address || 'N/A'}<br/>
                    Vehicle: {vehicleNumber || 'N/A'} - {vehicleDetails.brand} {vehicleDetails.model}
                </p>
            </div>
            <div className="invoice-dates text-end">
                <div className="date-row">
                    <span className="label">Invoice Date:</span>
                    <span className="value">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="date-row">
                    <span className="label">Terms:</span>
                    <span className="value">Due on Receipt</span>
                </div>
            </div>
        </div>

        <Table className="bill-table mt-4">
            <thead>
                <tr>
                    <th className="text-center">#</th>
                    <th>Item & Description</th>
                    <th className="text-center">Qty</th>
                    <th className="text-end">Rate</th>
                    <th className="text-end">Amount</th>
                </tr>
            </thead>
            <tbody>
                {spareParts.map((p, i) => (
                    <tr key={p.id}>
                        <td className="text-center">{i + 1}</td>
                        <td>
                            <div className="item-name">{p.name}</div>
                            <div className="item-sub">Automotive Spare Part</div>
                        </td>
                        <td className="text-center">1.00</td>
                        <td className="text-end">{p.amount}</td>
                        <td className="text-end">{p.amount}</td>
                    </tr>
                ))}
                {laborCharges.map((c, i) => (
                    <tr key={c.id}>
                        <td className="text-center">{spareParts.length + i + 1}</td>
                        <td>
                            <div className="item-name">{c.name}</div>
                            <div className="item-sub">Service Labor Charge</div>
                        </td>
                        <td className="text-center">1.00</td>
                        <td className="text-end">{c.amount}</td>
                        <td className="text-end">{c.amount}</td>
                    </tr>
                ))}
            </tbody>
        </Table>

        <div className="bill-summary-section">
            <div className="summary-box">
                <div className="summary-row">
                    <span>Sub Total</span>
                    <span>₹{calculateSubTotal().toFixed(2)}</span>
                </div>
                <div className="summary-row">
                    <span>Tax Rate</span>
                    <span>0.00%</span>
                </div>
                <div className="summary-row total">
                    <span>Total</span>
                    <span>₹{calculateTotal()}</span>
                </div>
            </div>
        </div>

        <div className="bill-footer mt-5 text-center">
            <div className="qr-box">SCAN TO PAY</div>
        </div>
    </div>
);

const Challen = () => {
    // Data States
    const [bookings, setBookings] = useState([]);
    const [inventorySpareParts, setInventorySpareParts] = useState([]);
    const [loading, setLoading] = useState(false);

    // Bill Content States
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [spareParts, setSpareParts] = useState([]);
    const [laborCharges, setLaborCharges] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [vehicleDetails, setVehicleDetails] = useState({
        brand: '',
        model: '',
        year: '',
        category: 'Bike'
    });

    // Modal & Search States
    const [bookingModalVisible, setBookingModalVisible] = useState(false);
    const [spareModalVisible, setSpareModalVisible] = useState(false);
    const [bookingSearch, setBookingSearch] = useState('');
    const [spareSearch, setSpareSearch] = useState('');
    const [viewInvoice, setViewInvoice] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Fetch initial data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [ordersRes, spareRes] = await Promise.all([
                axios.get('http://localhost:5000/api/vendor/orders', { headers }),
                axios.get('http://localhost:5000/api/spare-parts', { headers })
            ]);

            if (ordersRes.data.success) setBookings(ordersRes.data.orders);
            if (spareRes.data.success) setInventorySpareParts(spareRes.data.data);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectBooking = (booking) => {
        setSelectedBooking(booking);
        setCustomerName(booking.userDetails?.name || '');
        setVehicleNumber(booking.vehicleDetails?.registration_no || '');
        
        let uiCategory = 'Bike';
        const backendCat = booking.vehicleDetails?.vehicle_category;
        if (backendCat === '2_wheeler') uiCategory = 'Bike';
        else if (backendCat === '4_wheeler') uiCategory = 'Car';
        else if (backendCat === 'Heavy') uiCategory = 'Heavy';

        setVehicleDetails({
            brand: booking.vehicleDetails?.brand || '',
            model: booking.vehicleDetails?.model || '',
            year: booking.vehicleDetails?.year?.toString() || '',
            category: uiCategory
        });

        // Initialize labor charge from booking services
        const services = booking.serviceNames || (booking.services || []).map(s => s.name || s.serviceName);
        const laborDescription = services.length > 0 ? services.join(', ') : 'Service Charge';
        
        const totalAmount = parseFloat(booking.totalAmount) || 0;
        const tax = parseFloat(booking.tax) || 0;
        const amountWithoutTax = totalAmount - tax;

        setLaborCharges([{
            id: Date.now(),
            name: laborDescription,
            amount: amountWithoutTax.toFixed(2)
        }]);

        setBookingModalVisible(false);
    };

    const handleAddSparePart = (part) => {
        setSpareParts([...spareParts, {
            id: Date.now(),
            name: part.name,
            amount: part.amount
        }]);
        setSpareModalVisible(false);
    };

    const removeSparePart = (id) => {
        setSpareParts(spareParts.filter(p => p.id !== id));
    };

    const removeLaborCharge = (id) => {
        setLaborCharges(laborCharges.filter(c => c.id !== id));
    };

    const addManualLabor = () => {
        setLaborCharges([...laborCharges, { id: Date.now(), name: 'General Service', amount: '0.00' }]);
    };

    const updateLabor = (id, field, value) => {
        setLaborCharges(laborCharges.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const calculateSubTotal = () => {
        const sTotal = spareParts.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const lTotal = laborCharges.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
        return sTotal + lTotal;
    };

    const calculateTotal = () => {
        return calculateSubTotal().toFixed(2);
    };

    const handlePrint = () => {
        if (!selectedBooking) {
            alert('Please select a booking first');
            return;
        }
        window.print();
    };

    const handleSendBill = async () => {
        if (!selectedBooking) {
            alert('Please select a booking first');
            return;
        }

        setUploading(true);
        try {
            // Use the hidden capture element to ensure it works from both views
            const captureElement = document.getElementById('printable-bill-hidden');
            
            const canvas = await html2canvas(captureElement, {
                scale: 1.5, // Reduced from 2 to keep file size in check
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.8); // Switched to JPEG for smaller size
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            const pdfBlob = pdf.output('blob');
            console.log(`[PDF-GEN] Generated PDF size: ${(pdfBlob.size / 1024).toFixed(2)} KB`);

            const formData = new FormData();
            const fileName = `${customerName.replace(/\s+/g, '_')}_${selectedBooking.bookingRef}.pdf`;
            formData.append('bill', pdfBlob, fileName);
            formData.append('totalAmount', calculateTotal());
            formData.append('tax', '0');

            const token = sessionStorage.getItem('token');
            const response = await axios.post(
                `http://localhost:5000/api/vendor/orders/${selectedBooking._id}/bill`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                alert('Bill generated and sent successfully!');
                handleReset();
            }
        } catch (error) {
            console.error('Send failed:', error);
            alert('Failed to generate or send bill. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleReset = () => {
        setSelectedBooking(null);
        setCustomerName('');
        setVehicleNumber('');
        setVehicleDetails({ brand: '', model: '', year: '', category: 'Bike' });
        setSpareParts([]);
        setLaborCharges([]);
        setViewInvoice(false);
    };

    const filteredBookings = bookings.filter(b => 
        b.bookingRef?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
        b.userDetails?.name?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
        b.vehicleDetails?.registration_no?.toLowerCase().includes(bookingSearch.toLowerCase())
    );

    const filteredInventory = inventorySpareParts.filter(p =>
        p.name?.toLowerCase().includes(spareSearch.toLowerCase())
    );

    if (viewInvoice) {
        return (
            <div className="challen-container invoice-preview-mode">
                <div className="challen-header-actions no-print">
                    <Button variant="dark" onClick={() => setViewInvoice(false)}>Back to Edit</Button>
                    <div className="d-flex gap-2">
                        <Button variant="dark" onClick={handleSendBill} disabled={uploading}>
                            <Send size={18} className="me-2" />
                            {uploading ? 'Sending...' : 'Send to Customer'}
                        </Button>
                        <Button variant="warning" onClick={handlePrint}>
                            <Printer size={18} className="me-2" /> Print Bill
                        </Button>
                    </div>
                </div>
                <div id="printable-bill">
                    <InvoiceContent 
                        selectedBooking={selectedBooking}
                        customerName={customerName}
                        vehicleNumber={vehicleNumber}
                        vehicleDetails={vehicleDetails}
                        spareParts={spareParts}
                        laborCharges={laborCharges}
                        calculateSubTotal={calculateSubTotal}
                        calculateTotal={calculateTotal}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="challen-container">
            <div className="challen-form-card shadow-sm">
                <div className="form-header d-flex justify-content-between align-items-center mb-4">
                    <h2 className="form-title m-0">Generate Challen Bill</h2>
                    <Button variant="outline-warning" onClick={() => setBookingModalVisible(true)}>
                        <Search size={18} className="me-2" /> Select From Bookings
                    </Button>
                </div>

                <div className="row g-4">
                    {/* Customer & Vehicle Info */}
                    <div className="col-md-6">
                        <div className="form-section">
                            <h5 className="section-title">Customer Details</h5>
                            <Form.Group className="mb-3">
                                <Form.Label>Booking ID</Form.Label>
                                <Form.Control 
                                    className="dark-input" 
                                    placeholder="Select or Enter Booking ID"
                                    value={selectedBooking?.bookingRef || ''} 
                                    readOnly 
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Customer Name</Form.Label>
                                <Form.Control 
                                    className="dark-input" 
                                    value={customerName} 
                                    onChange={(e) => setCustomerName(e.target.value)} 
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Vehicle Number</Form.Label>
                                <Form.Control 
                                    className="dark-input" 
                                    value={vehicleNumber} 
                                    onChange={(e) => setVehicleNumber(e.target.value)} 
                                />
                            </Form.Group>
                        </div>
                    </div>

                    <div className="col-md-6">
                        <div className="form-section">
                            <h5 className="section-title">Vehicle Details</h5>
                            <div className="row">
                                <div className="col-6">
                                    <Form.Group className="mb-3">
                                        <Form.Label>Brand</Form.Label>
                                        <Form.Control 
                                            className="dark-input" 
                                            value={vehicleDetails.brand} 
                                            onChange={(e) => setVehicleDetails({...vehicleDetails, brand: e.target.value})} 
                                        />
                                    </Form.Group>
                                </div>
                                <div className="col-6">
                                    <Form.Group className="mb-3">
                                        <Form.Label>Model</Form.Label>
                                        <Form.Control 
                                            className="dark-input" 
                                            value={vehicleDetails.model} 
                                            onChange={(e) => setVehicleDetails({...vehicleDetails, model: e.target.value})} 
                                        />
                                    </Form.Group>
                                </div>
                            </div>
                            <Form.Group className="mb-3">
                                <Form.Label>Year</Form.Label>
                                <Form.Control 
                                    className="dark-input" 
                                    value={vehicleDetails.year} 
                                    onChange={(e) => setVehicleDetails({...vehicleDetails, year: e.target.value})} 
                                />
                            </Form.Group>
                        </div>
                    </div>

                    {/* Spare Parts Section */}
                    <div className="col-12">
                        <div className="form-section">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="section-title m-0">Spare Parts</h5>
                                <Button variant="warning" size="sm" onClick={() => setSpareModalVisible(true)}>
                                    <Plus size={16} /> Add Spare Part
                                </Button>
                            </div>
                            <Table responsive className="form-table">
                                <thead>
                                    <tr>
                                        <th>Part Name</th>
                                        <th className="text-end">Amount</th>
                                        <th className="text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {spareParts.map(p => (
                                        <tr key={p.id}>
                                            <td>{p.name}</td>
                                            <td className="text-end">₹{p.amount}</td>
                                            <td className="text-center">
                                                <Trash2 size={18} className="text-danger cursor-pointer" onClick={() => removeSparePart(p.id)} />
                                            </td>
                                        </tr>
                                    ))}
                                    {spareParts.length === 0 && <tr><td colSpan="3" className="text-center text-muted">No spare parts added</td></tr>}
                                </tbody>
                            </Table>
                        </div>
                    </div>

                    {/* Labor Charges Section */}
                    <div className="col-12">
                        <div className="form-section">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="section-title m-0">Labor Charges</h5>
                                <Button variant="warning" size="sm" onClick={addManualLabor}>
                                    <Plus size={16} /> Add Labor
                                </Button>
                            </div>
                            <Table responsive className="form-table">
                                <thead>
                                    <tr>
                                        <th>Description</th>
                                        <th className="text-end">Amount</th>
                                        <th className="text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {laborCharges.map(c => (
                                        <tr key={c.id}>
                                            <td>
                                                <Form.Control 
                                                    className="dark-input-inline" 
                                                    value={c.name} 
                                                    onChange={(e) => updateLabor(c.id, 'name', e.target.value)} 
                                                />
                                            </td>
                                            <td className="text-end">
                                                <Form.Control 
                                                    type="number"
                                                    className="dark-input-inline text-end" 
                                                    value={c.amount} 
                                                    onChange={(e) => updateLabor(c.id, 'amount', e.target.value)} 
                                                />
                                            </td>
                                            <td className="text-center">
                                                <Trash2 size={18} className="text-danger cursor-pointer" onClick={() => removeLaborCharge(c.id)} />
                                            </td>
                                        </tr>
                                    ))}
                                    {laborCharges.length === 0 && <tr><td colSpan="3" className="text-center text-muted">No labor charges added</td></tr>}
                                </tbody>
                            </Table>
                        </div>
                    </div>
                </div>

                <div className="form-footer mt-5 d-flex justify-content-between align-items-center">
                    <div className="total-display">
                        <span className="label">Grand Total:</span>
                        <span className="value">₹{calculateTotal()}</span>
                    </div>
                    <div className="footer-actions d-flex gap-3">
                        <Button variant="outline-light" onClick={handleReset}>Clear All</Button>
         
                        <Button variant="warning" size="lg" className="px-5" onClick={() => setViewInvoice(true)}>
                             View Invoice
                        </Button>
                                       <Button variant="dark" size="lg" className="px-4" onClick={handleSendBill} disabled={uploading}>
                            <Send size={18} className="me-2" />
                            {uploading ? 'Sending...' : 'Send Invoice'}
                        </Button>
                    </div>
                </div>
            </div>


            {/* Hidden capture area for automatic PDF generation */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '800px' }}>
                <div id="printable-bill-hidden">
                    <InvoiceContent 
                        selectedBooking={selectedBooking}
                        customerName={customerName}
                        vehicleNumber={vehicleNumber}
                        vehicleDetails={vehicleDetails}
                        spareParts={spareParts}
                        laborCharges={laborCharges}
                        calculateSubTotal={calculateSubTotal}
                        calculateTotal={calculateTotal}
                    />
                </div>
            </div>


            {/* Selection Modals */}
            <Modal show={bookingModalVisible} onHide={() => setBookingModalVisible(false)} centered className="challen-modal">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title>Select Active Booking</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="search-box mb-3">
                        <Search size={18} />
                        <input 
                            placeholder="Search by Ref or Name..." 
                            value={bookingSearch}
                            onChange={(e) => setBookingSearch(e.target.value)}
                        />
                    </div>
                    <div className="modal-list">
                        {filteredBookings.map(b => (
                            <div key={b._id} className="list-item" onClick={() => handleSelectBooking(b)}>
                                <div className="item-main">
                                    <strong>{b.bookingRef}</strong>
                                    <span>{b.userDetails?.name}</span>
                                </div>
                                <div className="item-sub">{b.vehicleDetails?.registration_no}</div>
                            </div>
                        ))}
                    </div>
                </Modal.Body>
            </Modal>

            <Modal show={spareModalVisible} onHide={() => setSpareModalVisible(false)} centered className="challen-modal">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title>Add Spare Part</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="search-box mb-3">
                        <Search size={18} />
                        <input 
                            placeholder="Search inventory..." 
                            value={spareSearch}
                            onChange={(e) => setSpareSearch(e.target.value)}
                        />
                    </div>
                    <div className="modal-list">
                        {filteredInventory.map(p => (
                            <div key={p._id} className="list-item" onClick={() => handleAddSparePart(p)}>
                                <div className="item-main">
                                    <strong>{p.name}</strong>
                                    <span>₹{p.amount}</span>
                                </div>
                                <Check size={16} className="text-success" />
                            </div>
                        ))}
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default Challen;

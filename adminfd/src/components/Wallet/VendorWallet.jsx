// components/Wallet/VendorWallet.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  PlusCircle, 
  Send, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  XCircle,
  HelpCircle
} from 'lucide-react';
import { Spinner, Modal, Button, Form, Alert } from 'react-bootstrap';
import './VendorWallet.css';

const VendorWallet = () => {
  // Balance & Stats
  const [wallet, setWallet] = useState(null);
  const [vendorId, setVendorId] = useState(null);
  const [vendorData, setVendorData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick Action Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Form Inputs
  const [addAmount, setAddAmount] = useState('');
  const [addNotes, setAddNotes] = useState('');
  const [adding, setAdding] = useState(false);

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branch: ''
  });
  const [withdrawing, setWithdrawing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchVendorWalletData = useCallback(async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // 1. Fetch balance, wallet & vendorId
      const balRes = await axios.get('http://localhost:5000/api/wallet/my-balance', { headers });
      if (balRes.data.success) {
        setWallet(balRes.data.wallet);
        setVendorId(balRes.data.vendorId);
      }

      // 2. Fetch vendor details to prefill bank info
      const profileRes = await axios.get('http://localhost:5000/api/vendor/profile', { headers });
      if (profileRes.data.success && profileRes.data.vendor) {
        setVendorData(profileRes.data.vendor);
        const bank = profileRes.data.vendor.bankDetails || {};
        setBankDetails({
          accountHolderName: bank.accountHolderName || '',
          accountNumber: bank.accountNumber || '',
          ifscCode: bank.ifscCode || '',
          bankName: bank.bankName || '',
          branch: bank.branch || ''
        });
      }

      // 3. Fetch transaction log
      const txRes = await axios.get('http://localhost:5000/api/wallet/transactions?limit=50', { headers });
      if (txRes.data.success) {
        setTransactions(txRes.data.transactions);
      }

      // 4. Fetch refund requests regarding this vendor
      const refRes = await axios.get('http://localhost:5000/api/wallet/refunds', { headers });
      if (refRes.data.success) {
        setRefunds(refRes.data.refunds);
      }
    } catch (error) {
      console.error('Error fetching vendor wallet data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendorWalletData();
  }, [fetchVendorWalletData]);

  // Add Funds Submission
  const handleAddFunds = async (e) => {
    e.preventDefault();
    if (!addAmount || parseFloat(addAmount) <= 0) return;
    setAdding(true);
    try {
      const token = sessionStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const response = await axios.post(
        'http://localhost:5000/api/wallet/add-funds', 
        { amount: parseFloat(addAmount), description: addNotes || 'Funds added by Vendor' },
        { headers }
      );

      if (response.data.success) {
        setShowAddModal(false);
        setAddAmount('');
        setAddNotes('');
        fetchVendorWalletData();
      }
    } catch (error) {
      console.error('Error depositing funds:', error);
      alert('Error transferring deposit');
    } finally {
      setAdding(false);
    }
  };

  // Withdraw Submission
  const handleWithdrawFunds = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) return;
    
    if (wallet && (wallet.pendingBalance || 0) < amt) {
      setErrorMsg(`Insufficient requestable earnings. You can withdraw up to ₹${(wallet.pendingBalance || 0).toFixed(2)}`);
      return;
    }

    setWithdrawing(true);
    try {
      const token = sessionStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const response = await axios.post(
        'http://localhost:5000/api/wallet/withdraw', 
        { amount: amt, bankDetails },
        { headers }
      );

      if (response.data.success) {
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        fetchVendorWalletData();
      }
    } catch (error) {
      console.error('Error requesting payout:', error);
      setErrorMsg(error.response?.data?.message || 'Error executing payout request');
    } finally {
      setWithdrawing(false);
    }
  };

  // Stats Calculations
  const totalEarned = transactions
    .filter(tx => tx.type === 'earning' && tx.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawn = transactions
    .filter(tx => tx.type === 'payout' && tx.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingWithdrawal = transactions
    .filter(tx => tx.type === 'payout' && tx.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="vendor-wallet-container">
      {/* Title Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="wallet-title">My Wallet</h1>
          <p className="wallet-subtitle">Manage your business earnings, payouts, and customer disputes</p>
        </div>
        <button className="btn-refresh" onClick={fetchVendorWalletData} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin-animation' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center align-items-center py-5 my-5">
          <Spinner animation="border" variant="warning" size="lg" />
        </div>
      ) : (
        <>
          {/* Dashboard Summary Cards */}
          <div className="row g-4 mb-4">
            {/* Primary Wallet Balance Card */}
            <div className="col-lg-5">
              <div className="card-wallet-primary">
                <div className="card-wallet-glow-effect"></div>
                <div className="card-body-wrapper">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="balance-lbl">AVAILABLE BALANCE (CLEARED)</span>
                    <Wallet size={24} className="balance-ic text-glow-orange" />
                  </div>
                  <div className="balance-value text-white mb-3">
                    ₹{(wallet?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-2 pt-3 border-top border-secondary">
                    <span className="balance-lbl small">REQUESTABLE SERVICE EARNINGS</span>
                    <Clock size={16} className="text-orange" />
                  </div>
                  <div className="balance-value text-orange mb-3" style={{ fontSize: '1.6rem' }}>
                    ₹{(wallet?.pendingBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  
                  {pendingWithdrawal > 0 && (
                    <div className="pending-hold-tag mt-2">
                      <Clock size={12} />
                      Pending Settlement Hold: ₹{pendingWithdrawal.toLocaleString('en-IN')}
                    </div>
                  )}
                  
                  {/* Action Buttons inside Card */}
                  <div className="d-flex gap-3 mt-4 pt-2">
                    <button className="btn-wallet-act primary" onClick={() => setShowWithdrawModal(true)}>
                      <Send size={16} /> Request Payout
                    </button>
                    {/* <button className="btn-wallet-act secondary" onClick={() => setShowAddModal(true)}>
                      <PlusCircle size={16} /> Add Funds
                    </button> */}
                  </div>
                </div>
              </div>
            </div>

            {/* Income Statistics */}
            <div className="col-lg-7">
              <div className="metrics-grid h-100">
                <div className="metric-box bg-dark-carbon">
                  <div className="metric-box-hdr">
                    <span className="metric-box-title">Service Earnings</span>
                    <ArrowDownLeft size={20} className="metric-icon text-green" />
                  </div>
                  <div className="metric-box-val text-green">
                    ₹{totalEarned.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="metric-box-meta">
                    Total gross revenue from bookings completed
                  </div>
                </div>

                <div className="metric-box bg-dark-carbon">
                  <div className="metric-box-hdr">
                    <span className="metric-box-title">Total Settled</span>
                    <ArrowUpRight size={20} className="metric-icon text-glow-orange" />
                  </div>
                  <div className="metric-box-val text-glow-orange">
                    ₹{totalWithdrawn.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="metric-box-meta">
                    Total payouts wired to your bank account
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            {/* Custom transaction log */}
            <div className="col-lg-8">
              <div className="sec-card">
                <div className="sec-card-header d-flex justify-content-between align-items-center mb-3">
                  <h2 className="sec-card-title">Transaction History</h2>
                  <span className="small">Showing last 20 entries</span>
                </div>
                <div className="table-responsive">
                  <table className="venum-table ledger-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Activity</th>
                        <th>Type</th>
                        <th className="text-end">Amount</th>
                        <th className="text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length > 0 ? (
                        transactions.map((tx) => (
                          <tr key={tx._id} className="ledger-row-hover">
                            <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                            <td className="desc-col">{tx.description}</td>
                            <td>
                              <span className={`badge-tx-type ${tx.type}`}>
                                {tx.type.toUpperCase()}
                              </span>
                            </td>
                            <td className={`fw-bold text-end ${['earning', 'add_funds'].includes(tx.type) ? 'text-green' : 'text-glow-orange'}`}>
                              {['earning', 'add_funds'].includes(tx.type) ? '+' : '-'} ₹{tx.amount.toFixed(2)}
                            </td>
                            <td className="text-center">
                              <span className={`badge-status ${tx.status}`}>
                                {tx.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center py-5">
                            No ledger transactions recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Refund Disputes sidebar panel */}
            <div className="col-lg-4">
              <div className="sec-card h-100">
                <div className="sec-card-header d-flex align-items-center gap-2 mb-3">
                  <AlertTriangle className="text-orange" size={18} />
                  <h2 className="sec-card-title">Refund Claims & Disputes</h2>
                </div>
                
                <div className="refund-disputes-list">
                  {refunds.length > 0 ? (
                    refunds.map(ref => (
                      <div className="refund-dispute-item" key={ref._id}>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <span className="booking-ref text-glow-orange">{ref.booking?.bookingRef || 'REF-N/A'}</span>
                          <span className={`badge-status ${ref.status}`}>
                            {ref.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="dispute-amount mb-1">
                          Claim Amount: <strong className="text-white">₹{ref.amount.toFixed(2)}</strong>
                        </div>
                        <div className="dispute-reason mb-2">
                          "{ref.reason}"
                        </div>
                        {ref.adminNotes && (
                          <div className="admin-resolution-notes">
                            <HelpCircle size={10} /> Admin: {ref.adminNotes}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-5 small">
                      🎉 No active dispute claims or refunds linked to your services.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add Funds Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered className="venum-modal">
        <div className="modal-content-venum">
          <Form onSubmit={handleAddFunds}>
            <div className="modal-header border-0">
              <h5 className="modal-title text-white font-weight-bold">Simulate Adding Capital</h5>
            </div>
            <div className="modal-body">
              <Form.Group className="mb-3">
                <Form.Label className="small">Amount to Deposit (INR)</Form.Label>
                <Form.Control 
                  type="number" 
                  min="1" 
                  step="0.01"
                  required
                  placeholder="Enter amount (e.g. 5000)" 
                  className="bg-input text-white border-secondary"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="small">Notes / Description (Optional)</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="e.g. Deposit for spare parts inventory"
                  className="bg-input text-white border-secondary"
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                />
              </Form.Group>
              <div className="alert-box-venum bg-dark">
                ℹ️ This is a simulated transaction. Funds will be directly added to your digital dashboard wallet.
              </div>
            </div>
            <div className="modal-footer border-0 d-flex gap-2">
              <Button variant="outline-secondary" onClick={() => setShowAddModal(false)} disabled={adding}>
                Cancel
              </Button>
              <Button variant="warning" type="submit" className="text-white px-4" disabled={adding}>
                {adding ? 'Depositing...' : 'Confirm Deposit'}
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      {/* Withdraw Modal */}
      <Modal show={showWithdrawModal} onHide={() => setShowWithdrawModal(false)} centered className="venum-modal">
        <div className="modal-content-venum">
          <Form onSubmit={handleWithdrawFunds}>
            <div className="modal-header border-0">
              <h5 className="modal-title text-white font-weight-bold">Initiate Bank Withdrawal</h5>
            </div>
            <div className="modal-body">
              {errorMsg && <Alert variant="danger" className="bg-dark text-danger border-danger small py-2">{errorMsg}</Alert>}
              
              <Form.Group className="mb-3">
                <Form.Label className="text-orange small font-weight-bold">Amount to Settle (₹)</Form.Label>
                <Form.Control 
                  type="number" 
                  min="100" 
                  step="0.01"
                  required
                  placeholder={`Max ₹${wallet?.pendingBalance?.toFixed(2) || '0.00'}`} 
                  className="bg-input text-white border-secondary font-weight-bold"
                  style={{fontSize:'20px'}}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
              </Form.Group>

              <hr className="border-secondary mb-3" />
              
              <h6 className="small mb-2 text-uppercase font-weight-bold">Recipient Bank account info</h6>
              
              <div className="row g-2">
                <div className="col-md-6">
                  <Form.Group className="mb-2">
                    <Form.Label className="small">Account Holder</Form.Label>
                    <Form.Control 
                      type="text" 
                      required
                      placeholder="Name on account"
                      className="bg-input text-white border-secondary small"
                      value={bankDetails.accountHolderName}
                      onChange={(e) => setBankDetails({...bankDetails, accountHolderName: e.target.value})}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-2">
                    <Form.Label className="small">Account Number</Form.Label>
                    <Form.Control 
                      type="text" 
                      required
                      placeholder="Account number"
                      className="bg-input text-white border-secondary small"
                      value={bankDetails.accountNumber}
                      onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                    />
                  </Form.Group>
                </div>
              </div>

              <div className="row g-2">
                <div className="col-md-6">
                  <Form.Group className="mb-2">
                    <Form.Label className="small">IFSC Code</Form.Label>
                    <Form.Control 
                      type="text" 
                      required
                      placeholder="IFSC (e.g. SBIN000182)"
                      className="bg-input text-white border-secondary small"
                      value={bankDetails.ifscCode}
                      onChange={(e) => setBankDetails({...bankDetails, ifscCode: e.target.value})}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-2">
                    <Form.Label className="small">Bank Name</Form.Label>
                    <Form.Control 
                      type="text" 
                      required
                      placeholder="State Bank of India"
                      className="bg-input text-white border-secondary small"
                      value={bankDetails.bankName}
                      onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                    />
                  </Form.Group>
                </div>
              </div>

              <div className="alert-box-venum warning mt-3">
                ⚠️ Withdrawn funds will be put on settlement hold immediately, and wired to the target account upon Admin confirmation within 24-48 hours.
              </div>
            </div>
            <div className="modal-footer border-0 d-flex gap-2">
              <Button variant="outline-secondary" onClick={() => setShowWithdrawModal(false)} disabled={withdrawing}>
                Cancel
              </Button>
              <Button variant="warning" type="submit" className="text-white px-4" disabled={withdrawing}>
                {withdrawing ? 'Submitting...' : 'Request Payout'}
              </Button>
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default VendorWallet;

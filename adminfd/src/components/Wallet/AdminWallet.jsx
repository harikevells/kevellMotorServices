// components/Wallet/AdminWallet.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  Download, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Briefcase 
} from 'lucide-react';
import { Spinner, Modal, Button, Form } from 'react-bootstrap';
import './AdminWallet.css';

const AdminWallet = () => {
  // Stat States
  const [stats, setStats] = useState({
    totalFees: 0,
    totalPayouts: 0,
    totalWalletHolding: 0,
    pendingRefundCount: 0
  });
  
  // Wallet & Refund States
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendorBalances, setVendorBalances] = useState([]);
  const [activeTab, setActiveTab] = useState('settlement');

  // Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [txPerPage] = useState(6);
  const [vendorPage, setVendorPage] = useState(1);

  // Moderation Modal States
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [modAction, setModAction] = useState('approved');
  const [adminNotes, setAdminNotes] = useState('');
  const [modulating, setModulating] = useState(false);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // 1. Fetch balance & vendor status (to assert wallet)
      const balRes = await axios.get('http://localhost:5000/api/wallet/my-balance', { headers });
      if (balRes.data.success) {
        setWallet(balRes.data.wallet);
      }

      // 2. Fetch admin overview stats
      const statsRes = await axios.get('http://localhost:5000/api/wallet/admin/overview', { headers });
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }

      // 3. Fetch all system transactions
      const txRes = await axios.get('http://localhost:5000/api/wallet/transactions?limit=200', { headers });
      if (txRes.data.success) {
        setTransactions(txRes.data.transactions);
      }

      // 4. Fetch refund requests
      const refRes = await axios.get('http://localhost:5000/api/wallet/refunds', { headers });
      if (refRes.data.success) {
        setRefunds(refRes.data.refunds);
      }

      // 5. Fetch vendor balances
      const venRes = await axios.get('http://localhost:5000/api/wallet/admin/vendor-balances', { headers });
      if (venRes.data.success) {
        setVendorBalances(venRes.data.vendorBalances);
      }
    } catch (error) {
      console.error('Error fetching admin wallet data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  // Handle Payout Moderation Action
  const handlePayoutAction = async (transactionId, action) => {
    if (!window.confirm(`Are you sure you want to ${action === 'complete' ? 'Approve & Settle' : 'Reject'} this payout request?`)) return;
    try {
      const token = sessionStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const response = await axios.post(
        `http://localhost:5000/api/wallet/payouts/${transactionId}/action`,
        { action },
        { headers }
      );

      if (response.data.success) {
        alert(`Payout successfully ${action === 'complete' ? 'approved & settled' : 'rejected and returned to vendor'}`);
        fetchAdminData();
      }
    } catch (error) {
      console.error('Error moderating payout:', error);
      alert(error.response?.data?.message || 'Error processing payout decision');
    }
  };

  // Handle Refund Action
  const handleOpenRefundModal = (refund, action) => {
    setSelectedRefund(refund);
    setModAction(action);
    setAdminNotes('');
    setShowRefundModal(true);
  };

  const submitRefundDecision = async () => {
    if (!selectedRefund) return;
    setModulating(true);
    try {
      const token = sessionStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const response = await axios.post(
        `http://localhost:5000/api/wallet/refunds/${selectedRefund._id}/action`, 
        { action: modAction, adminNotes }, 
        { headers }
      );

      if (response.data.success) {
        setShowRefundModal(false);
        // Refresh page data
        fetchAdminData();
      }
    } catch (error) {
      console.error('Error moderating refund:', error);
      alert(error.response?.data?.message || 'Error processing refund moderation');
    } finally {
      setModulating(false);
    }
  };

  // Filter Transactions
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'all') return matchesSearch;
    return matchesSearch && tx.type === filterType;
  });

  // Pagination Math
  const indexOfLastTx = currentPage * txPerPage;
  const indexOfFirstTx = indexOfLastTx - txPerPage;
  const currentTxs = filteredTransactions.slice(indexOfFirstTx, indexOfLastTx);
  const totalPages = Math.ceil(filteredTransactions.length / txPerPage);

  // Vendor Pagination Math
  const vendorPerPage = 6;
  const indexOfLastVendor = vendorPage * vendorPerPage;
  const indexOfFirstVendor = indexOfLastVendor - vendorPerPage;
  const currentVendors = vendorBalances.slice(indexOfFirstVendor, indexOfLastVendor);
  const totalVendorPages = Math.ceil(vendorBalances.length / vendorPerPage);

  // CSV Export Utility
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;
    
    const headers = ['Transaction ID', 'User Name', 'Role', 'Type', 'Amount', 'Status', 'Description', 'Date'];
    const rows = filteredTransactions.map(tx => [
      tx._id,
      tx.user?.name || 'Unknown',
      tx.user?.role || 'N/A',
      tx.type,
      `₹${tx.amount.toFixed(2)}`,
      tx.status,
      tx.description.replace(/,/g, ' '),
      new Date(tx.createdAt).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Platform_Statement_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="admin-wallet-container">
      {/* Upper Title Row */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="wallet-title">Wallet Control Panel</h1>
          <p className="wallet-subtitle">Platform finance ledger, disputes resolution, and payout settlements</p>
        </div>
        <button className="btn-refresh" onClick={fetchAdminData} disabled={loading}>
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
          {/* Key Metric Blocks */}
          <div className="metrics-grid">
            <div className="metric-box">
              <div className="metric-box-hdr">
                <span className="metric-box-title">Platform Net Revenue</span>
                <DollarSign size={20} className="metric-icon text-orange" />
              </div>
              <div className="metric-box-val text-glow-orange">
                ₹{(stats.adminWalletBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="metric-box-meta">
                Commission earnings & balances
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-box-hdr">
                <span className="metric-box-title">Total Platform Fees</span>
                <TrendingUp size={20} className="metric-icon text-green" />
              </div>
              <div className="metric-box-val text-green">
                ₹{stats.totalFees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="metric-box-meta">
                10% charge on booking orders
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-box-hdr">
                <span className="metric-box-title">Total Settled Payouts</span>
                <ArrowUpRight size={20} className="metric-icon" />
              </div>
              <div className="metric-box-val">
                ₹{stats.totalPayouts.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="metric-box-meta">
                Paid out to service providers
              </div>
            </div>

            <div className="metric-box">
              <div className="metric-box-hdr">
                <span className="metric-box-title">Wallet holdings (Float)</span>
                <ArrowDownLeft size={20} className="metric-icon text-yellow" />
              </div>
              <div className="metric-box-val text-yellow">
                ₹{stats.totalWalletHolding.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="metric-box-meta">
                Active deposits in vendor accounts
              </div>
            </div>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="wallet-tabs-container mb-4">
            <button 
              className={`wallet-tab ${activeTab === 'settlement' ? 'active' : ''}`}
              onClick={() => setActiveTab('settlement')}
            >
              Settlement Request
            </button>
            <button 
              className={`wallet-tab ${activeTab === 'ledger' ? 'active' : ''}`}
              onClick={() => setActiveTab('ledger')}
            >
              Financial Ledger
            </button>
            <button 
              className={`wallet-tab ${activeTab === 'vendor_billing' ? 'active' : ''}`}
              onClick={() => setActiveTab('vendor_billing')}
            >
              Vendor Billing
            </button>
            <button 
              className={`wallet-tab ${activeTab === 'refund_disputes' ? 'active' : ''}`}
              onClick={() => setActiveTab('refund_disputes')}
            >
              Refund & Disputes
            </button>
          </div>

          {activeTab === 'refund_disputes' && (
          <div className="sec-card mb-4">
            <div className="sec-card-header d-flex align-items-center gap-2">
              <AlertTriangle className="text-orange" size={20} />
              <h2 className="sec-card-title">Refund & Disputes Moderation Desk</h2>
              <span className="badge-count bg-glow-orange">{stats.pendingRefundCount} Active Disputes</span>
            </div>
            <div className="table-responsive">
              <table className="venum-table">
                <thead>
                  <tr>
                    <th>Booking REF</th>
                    <th>Customer Name</th>
                    <th>Service Shop</th>
                    <th>Refund Claim</th>
                    <th>Dispute Reason</th>
                    <th className="text-center">Action Moderator</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.filter(r => r.status === 'pending').length > 0 ? (
                    refunds
                      .filter(r => r.status === 'pending')
                      .map(ref => (
                        <tr key={ref._id}>
                          <td className="text-glow-orange fw-bold">{ref.booking?.bookingRef || 'REF-N/A'}</td>
                          <td>
                            <div className="customer-cell">
                              <span className="c-name">{ref.user?.name}</span>
                              <span className="c-sub">{ref.user?.phone}</span>
                            </div>
                          </td>
                          <td>
                            <div className="shop-cell">
                              <span className="s-name">{ref.vendor?.shopName}</span>
                              <span className="s-sub">{ref.vendor?.ownerName}</span>
                            </div>
                          </td>
                          <td className="fw-bold text-glow-orange">₹{ref.amount.toFixed(2)}</td>
                          <td className="reason-cell" title={ref.reason}>
                            <div className="text-truncate" style={{ maxWidth: '280px' }}>
                              {ref.reason}
                            </div>
                            {ref.disputeNotes && (
                              <div className="small text-yellow text-truncate" style={{ maxWidth: '280px' }}>
                                Dispute: {ref.disputeNotes}
                              </div>
                            )}
                          </td>
                          <td className="text-center">
                            <div className="moderator-actions-group">
                              <button 
                                className="btn-action-mod approve" 
                                title="Approve Refund"
                                onClick={() => handleOpenRefundModal(ref, 'approved')}
                              >
                                <CheckCircle size={16} /> Approve
                              </button>
                              <button 
                                className="btn-action-mod reject" 
                                title="Reject & Deny Refund"
                                onClick={() => handleOpenRefundModal(ref, 'rejected')}
                              >
                                <XCircle size={16} /> Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-4">
                        🎉 There are no pending refund claims or active booking disputes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {activeTab === 'settlement' && (
          <div className="sec-card mb-4">
            <div className="sec-card-header d-flex align-items-center gap-2">
              <DollarSign className="text-orange" size={20} />
              <h2 className="sec-card-title">Vendor Payout & Settlement Requests</h2>
              <span className="badge-count bg-glow-orange">
                {transactions.filter(t => t.type === 'payout' && t.status === 'pending').length} Pending
              </span>
            </div>
            <div className="table-responsive">
              <table className="venum-table">
                <thead>
                  <tr>
                    <th>Date Requested</th>
                    <th>Vendor Name</th>
                    <th>Email Address</th>
                    <th>Requested Payout</th>
                    <th>Bank & Recipient Credentials</th>
                    <th className="text-center">Action Settle</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.filter(t => t.type === 'payout' && t.status === 'pending').length > 0 ? (
                    transactions
                      .filter(t => t.type === 'payout' && t.status === 'pending')
                      .map(payout => (
                        <tr key={payout._id}>
                          <td>{new Date(payout.createdAt).toLocaleDateString()}</td>
                          <td className="fw-bold">{payout.user?.name || 'Vendor'}</td>
                          <td>{payout.user?.email || 'N/A'}</td>
                          <td className="fw-bold text-glow-orange">₹{payout.amount.toFixed(2)}</td>
                          <td className="reason-cell" style={{fontSize: '12.5px'}}>
                            {payout.description}
                          </td>
                          <td className="text-center">
                            <div className="moderator-actions-group">
                              <button 
                                className="btn-action-mod approve" 
                                title="Approve & Settle Payout"
                                onClick={() => handlePayoutAction(payout._id, 'complete')}
                              >
                                <CheckCircle size={16} /> Settle Payout
                              </button>
                              <button 
                                className="btn-action-mod reject" 
                                title="Reject payout request"
                                onClick={() => handlePayoutAction(payout._id, 'reject')}
                              >
                                <XCircle size={16} /> Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-4">
                        🎉 All vendor withdrawal and settlement requests have been fully processed.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {activeTab === 'ledger' && (
          <div className="sec-card">
            <div className="sec-card-header d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div className="d-flex align-items-center gap-2">
                <Briefcase className="text-orange" size={20} />
                <h2 className="sec-card-title">System-wide Financial Ledger</h2>
              </div>

              {/* Filters & Export */}
              <div className="ledger-controls-group">
                <div className="search-box-glow">
                  <Search size={16} className="search-ic" />
                  <input 
                    type="text" 
                    placeholder="Search ledger by name or description..." 
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>

                <select 
                  className="venum-select"
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Transactions</option>
                  <option value="platform_fee">Platform Fees</option>
                  <option value="payout">Payout Settlements</option>
                  <option value="refund">Refund Deductions</option>
                  <option value="add_funds">Deposited Funds</option>
                  <option value="earning">Service Earnings</option>
                </select>

                <button className="btn-export-csv" onClick={handleExportCSV}>
                  <Download size={16} />
                  CSV Export
                </button>
              </div>
            </div>

            <div className="table-responsive mt-3">
              <table className="venum-table ledger-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>User Profile</th>
                    <th>Role</th>
                    <th>Activity Type</th>
                    <th>Amount</th>
                    <th>Ledger Status</th>
                    <th>Notes & Description</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTxs.length > 0 ? (
                    currentTxs.map((tx) => (
                      <tr key={tx._id} className="ledger-row-hover">
                        <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="customer-cell">
                            <span className="c-name">{tx.user?.name || 'System Auto'}</span>
                            <span className="c-sub">{tx.user?.email || 'payouts@system.com'}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge-role ${tx.user?.role || 'admin'}`}>
                            {(tx.user?.role || 'admin').toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span className={`badge-tx-type ${tx.type}`}>
                            {tx.type.toUpperCase().replace('_', ' ')}
                          </span>
                        </td>
                        <td className={`fw-bold ${['earning', 'platform_fee', 'add_funds'].includes(tx.type) ? 'text-green' : 'text-glow-orange'}`}>
                          {['earning', 'platform_fee', 'add_funds'].includes(tx.type) ? '+' : '-'} ₹{tx.amount.toFixed(2)}
                        </td>
                        <td>
                          <span className={`badge-status ${tx.status}`}>
                            {tx.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="desc-col">{tx.description}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-5">
                        No transactions found matching the selected search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top border-secondary">
                <span className="small">
                  Showing {indexOfFirstTx + 1} to {Math.min(indexOfLastTx, filteredTransactions.length)} of {filteredTransactions.length} items
                </span>
                <div className="d-flex gap-2">
                  <Button 
                    variant="outline-dark" 
                    size="sm" 
                    className="pagi-btn text-white"
                    style={{ minWidth: '90px', padding: '6px 12px' }}
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                  >
                    Previous
                  </Button>
                  <span className="pagi-indicator text-white d-flex align-items-center px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button 
                    variant="outline-dark" 
                    size="sm" 
                    className="pagi-btn text-white"
                    style={{ minWidth: '90px', padding: '6px 12px' }}
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
          )}

          {activeTab === 'vendor_billing' && (
          <div className="sec-card mt-4 mb-4">
            <div className="sec-card-header d-flex align-items-center gap-2">
              <DollarSign className="text-orange" size={20} />
              <h2 className="sec-card-title">Vendor Account Balances</h2>
              <span className="badge-count bg-glow-orange">{vendorBalances.length} Vendors</span>
            </div>
            <div className="table-responsive">
              <table className="venum-table">
                <thead>
                  <tr>
                    <th>Shop Name</th>
                    <th>Owner Name</th>
                    <th>Contact Email</th>
                    <th>Contact Phone</th>
                    <th>Available Balance</th>
                    <th>Pending Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {currentVendors.length > 0 ? (
                    currentVendors.map(vendor => (
                      <tr key={vendor.vendorId}>
                        <td className="fw-bold text-white">{vendor.shopName}</td>
                        <td>{vendor.ownerName}</td>
                        <td className="">{vendor.email}</td>
                        <td className="">{vendor.contact || 'N/A'}</td>
                        <td className="fw-bold text-green">₹{vendor.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="fw-bold text-yellow">₹{vendor.pendingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-4">
                        No vendor accounts found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Vendor Pagination Controls */}
            {totalVendorPages > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top border-secondary p-3">
                <span className="small text-muted">
                  Showing {indexOfFirstVendor + 1} to {Math.min(indexOfLastVendor, vendorBalances.length)} of {vendorBalances.length} vendors
                </span>
                <div className="d-flex gap-2">
                  <Button 
                    variant="outline-dark" 
                    size="sm" 
                    className="pagi-btn text-white"
                    style={{ minWidth: '90px', padding: '6px 12px' }}
                    disabled={vendorPage === 1}
                    onClick={() => setVendorPage(prev => prev - 1)}
                  >
                    Previous
                  </Button>
                  <span className="pagi-indicator text-white d-flex align-items-center px-2">
                    Page {vendorPage} of {totalVendorPages}
                  </span>
                  <Button 
                    variant="outline-dark" 
                    size="sm" 
                    className="pagi-btn text-white"
                    style={{ minWidth: '90px', padding: '6px 12px' }}
                    disabled={vendorPage === totalVendorPages}
                    onClick={() => setVendorPage(prev => prev + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
          )}
        </>
      )}

      {/* Refund Moderation Decision Modal */}
      <Modal 
        show={showRefundModal} 
        onHide={() => setShowRefundModal(false)}
        centered
        className="venum-modal"
      >
        <div className="modal-content-venum">
          <div className="modal-header border-0">
            <h5 className="modal-title font-weight-bold text-white">
              Moderate Claim for {selectedRefund?.booking?.bookingRef}
            </h5>
          </div>
          <div className="modal-body">
            <p className="text-white small mb-3">
              You are about to <strong>{modAction}</strong> a customer refund request of 
              <strong className="text-glow-orange"> ₹{selectedRefund?.amount.toFixed(2)}</strong>.
            </p>
            {modAction === 'approved' && (
              <div className="alert-box-venum warning mb-3">
                ⚠️ Approving this claim will immediately credit the customer's wallet and deduct this amount from Vendor <strong>{selectedRefund?.vendor?.shopName}</strong>'s balance.
              </div>
            )}
            <Form.Group className="mb-3">
              <Form.Label className="small">Dispute Decision Notes (Optional)</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                className="bg-input text-white border-secondary"
                placeholder="Explain the reason for approval or rejection of this dispute..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </Form.Group>
          </div>
          <div className="modal-footer border-0 d-flex gap-2">
            <Button 
              variant="outline-secondary" 
              onClick={() => setShowRefundModal(false)}
              className="px-4"
              disabled={modulating}
            >
              Cancel
            </Button>
            <Button 
              variant={modAction === 'approved' ? 'success' : 'danger'}
              onClick={submitRefundDecision}
              className="px-4 text-white"
              disabled={modulating}
            >
              {modulating ? 'Processing...' : `Confirm ${modAction.toUpperCase()}`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminWallet;

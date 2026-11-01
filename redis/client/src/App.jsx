import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api/auth';

export default function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval = null;
    if (currentStep === 2 && resendTimer > 0) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [currentStep, resendTimer]);

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const getPasswordStrength = () => {
    const len = formData.password.length;
    if (len === 0) return { width: '0%', text: '', color: '#334155' };
    if (len < 6) return { width: '33%', text: 'Weak', color: '#ef4444' };
    if (len < 10) return { width: '66%', text: 'Medium', color: '#eab308' };
    return { width: '100%', text: 'Strong', color: '#10b981' };
  };

  const strength = getPasswordStrength();

  const handleOtpChange = (value, index) => {
    if (isNaN(value)) return;
    const newOtpValues = [...otpValues];
    newOtpValues[index] = value.substring(value.length - 1);
    setOtpValues(newOtpValues);
    if (value && index < 5) {
      document.getElementById(`otp-input-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!otpValues[index] && index > 0) {
        document.getElementById(`otp-input-${index - 1}`)?.focus();
      } else {
        const newOtpValues = [...otpValues];
        newOtpValues[index] = '';
        setOtpValues(newOtpValues);
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (pasteData.length === 6 && !isNaN(pasteData)) {
      setOtpValues(pasteData.split(''));
      document.getElementById('otp-input-5')?.focus();
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setMessage({ text: 'Passwords do not match.', isError: true });
      return;
    }
    if (!acceptedTerms) {
      setMessage({ text: 'You must accept the terms and privacy policy.', isError: true });
      return;
    }

    setLoading(true);
    setMessage({ text: '', isError: false });

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Username: formData.username, Email: formData.email, password: formData.password })
      });
      const data = await response.json();

      if (response.ok) {
        setMessage({ text: 'OTP sent successfully! Check your inbox.', isError: false });
        setCurrentStep(2);
        setResendTimer(60);
        setCanResend(false);
        setOtpValues(['', '', '', '', '', '']);
      } else {
        setMessage({ text: data.message || 'Registration failed.', isError: true });
      }
    } catch {
      setMessage({ text: 'Unable to connect to the authentication server.', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const completeOtp = otpValues.join('');
    if (completeOtp.length < 6) {
      setMessage({ text: 'Please enter the complete 6-digit OTP code.', isError: true });
      return;
    }

    setLoading(true);
    setMessage({ text: '', isError: false });

    try {
      const response = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Email: formData.email, otp: completeOtp })
      });
      const data = await response.json();

      if (response.ok) {
        setMessage({ text: '🎉 Account Verified & Created Successfully!', isError: false });
        setCurrentStep(3);
      } else {
        setMessage({ text: data.message || 'Invalid or Expired OTP.', isError: true });
      }
    } catch {
      setMessage({ text: 'Verification transaction failed.', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setLoading(true);
    setMessage({ text: '', isError: false });

    try {
      const response = await fetch(`${API_BASE_URL}/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Email: formData.email })
      });
      const data = await response.json();

      if (response.ok) {
        setMessage({ text: 'A new OTP has been sent to your email.', isError: false });
        setResendTimer(60);
        setCanResend(false);
        setOtpValues(['', '', '', '', '', '']);
      } else {
        setMessage({ text: data.message || 'Failed to resend OTP.', isError: true });
      }
    } catch {
      setMessage({ text: 'Connectivity error while resending OTP.', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    window.location.href = `${API_BASE_URL}/google`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
        {/* Left Branding Panel */}
        <div style={styles.leftPanel}>
          <div>
            <div style={styles.topGraphicBar}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#eab308' }}></div>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
              </div>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Secured Ecosystem</span>
            </div>

            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#ffffff', marginBottom: '12px' }}>
              Welcome to TechFlow Inc.
            </h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '32px' }}>
              Welcome to user authentication and secure our authentication ecosystem now.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {['Effortless Access', 'Secure Platform', 'Social Integration', '2FA Security'].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#cbd5e1' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #1e293b', fontSize: '12px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Already have an account?</span>
            <a href="#signin" onClick={e => e.preventDefault()} style={{ color: '#34d399', fontWeight: '600', textDecoration: 'none' }}>Sign in</a>
          </div>
        </div>

        {/* Right Form Panel */}
        <div style={styles.rightPanel}>
          <div>
            <div style={styles.stepBar}>
              {[1, 2, 3].map(step => (
                <div key={step} style={{ ...styles.stepTab, ...(currentStep === step ? styles.activeStepTab : {}) }}>
                  Step {step}
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
                {currentStep === 1 && 'Step 1: Create Your Account'}
                {currentStep === 2 && 'Step 2: Verify Your Email'}
                {currentStep === 3 && 'Step 3: Registration Complete'}
              </h2>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                {currentStep === 1 && 'Please fill in your credentials to get started.'}
                {currentStep === 2 && `Enter the 6-digit confirmation code sent to ${formData.email}`}
                {currentStep === 3 && 'Your account has been successfully verified and activated.'}
              </p>
            </div>

            {message.text && (
              <div style={{ ...styles.messageBanner, backgroundColor: message.isError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', borderColor: message.isError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: message.isError ? '#f87171' : '#34d399' }}>
                {message.text}
              </div>
            )}

            {currentStep === 1 && (
              <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={styles.label}>Full Name</label>
                  <input type="text" name="username" required autoComplete="name" value={formData.username} onChange={handleInputChange} style={styles.input} placeholder="Serah Jenkins" />
                </div>

                <div>
                  <label style={styles.label}>Email Address</label>
                  <input type="email" name="email" required autoComplete="email" value={formData.email} onChange={handleInputChange} style={styles.input} placeholder="serah.j@gmail.com" />
                </div>

                <div>
                  <label style={styles.label}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} name="password" required autoComplete="new-password" value={formData.password} onChange={handleInputChange} style={{ ...styles.input, paddingRight: '50px' }} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.showPassBtn}>
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {formData.password && (
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                      <div style={{ width: '100%', backgroundColor: '#1e293b', height: '6px', borderRadius: '3px', overflow: 'hidden', marginRight: '12px' }}>
                        <div style={{ height: '100%', width: strength.width, backgroundColor: strength.color, transition: 'all 0.3s' }}></div>
                      </div>
                      <span style={{ color: '#94a3b8', fontWeight: '500' }}>{strength.text}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label style={styles.label}>Confirm Password</label>
                  <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleInputChange} style={styles.input} placeholder="••••••••" />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#94a3b8' }}>
                  <input type="checkbox" id="terms" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} style={{ accentColor: '#10b981' }} />
                  <label htmlFor="terms">Terms & conditions, <span style={{ color: '#34d399', textDecoration: 'underline' }}>Privacy policy</span></label>
                </div>

                <button type="submit" disabled={loading} style={styles.button}>
                  {loading ? 'Processing...' : 'Next: Verify via OTP'}
                </button>
              </form>
            )}

            {currentStep === 2 && (
              <form onSubmit={handleOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingTop: '16px' }}>
                <div>
                  <label style={{ ...styles.label, textAlign: 'center', display: 'block', marginBottom: '12px' }}>Secure 6-Digit Token (OTP)</label>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }} onPaste={handleOtpPaste}>
                    {otpValues.map((val, idx) => (
                      <input
                        key={idx}
                        id={`otp-input-${idx}`}
                        type="text"
                        maxLength={1}
                        value={val}
                        onChange={e => handleOtpChange(e.target.value, idx)}
                        onKeyDown={e => handleOtpKeyDown(e, idx)}
                        style={styles.otpInput}
                      />
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={loading} style={styles.button}>
                  {loading ? 'Validating Token...' : 'Confirm & Complete Registration'}
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <button type="button" onClick={() => { setCurrentStep(1); setMessage({ text: '', isError: false }); }} style={styles.linkButton}>
                    ← Edit details
                  </button>
                  <button type="button" onClick={handleResendOtp} disabled={!canResend || loading} style={{ ...styles.linkButton, color: canResend ? '#34d399' : '#475569', cursor: canResend ? 'pointer' : 'not-allowed' }}>
                    {canResend ? 'Resend OTP' : `Resend in ${resendTimer}s`}
                  </button>
                </div>
              </form>
            )}

            {currentStep === 3 && (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#34d399', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 16px' }}>
                  ✓
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>You're All Set!</h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '260px', margin: '0 auto 24px' }}>
                  Your account has been successfully verified and registered with Node.js, Redis, and MongoDB.
                </p>
                <button type="button" onClick={() => { setCurrentStep(1); setFormData({ username: '', email: '', password: '', confirmPassword: '' }); }} style={styles.secondaryButton}>
                  Back to Registration
                </button>
              </div>
            )}
          </div>

          {currentStep === 1 && (
            <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #1e293b' }}>
              <p style={{ textAlign: 'center', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', fontWeight: '600' }}>Or Register with</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <button type="button" onClick={handleGoogleAuth} style={styles.socialButton}>
                  <span>Google</span>
                </button>
                <button type="button" onClick={() => alert("GitHub auth clicked")} style={styles.socialButton}>
                  <span>GitHub</span>
                </button>
                <button type="button" onClick={() => alert("Apple auth clicked")} style={styles.socialButton}>
                  <span>Apple</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#020617',
    color: '#f8fafc',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '24px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '1000px',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    border: '1px solid #1e293b',
    borderRadius: '24px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  },
  leftPanel: {
    background: 'linear-gradient(to bottom right, #0f172a, #020617, #0f172a)',
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    borderRight: '1px solid #1e293b',
  },
  rightPanel: {
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  topGraphicBar: {
    width: '100%',
    backgroundColor: 'rgba(2, 6, 23, 0.6)',
    border: '1px solid #1e293b',
    borderRadius: '16px',
    padding: '16px',
    marginBottom: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
  },
  stepBar: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '24px',
    backgroundColor: 'rgba(2, 6, 23, 0.6)',
    padding: '6px',
    borderRadius: '16px',
    border: '1px solid #1e293b',
  },
  stepTab: {
    flex: 1,
    textAlign: 'center',
    padding: '8px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#94a3b8',
    transition: 'all 0.3s',
  },
  activeStepTab: {
    backgroundColor: '#059669',
    color: '#ffffff',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
  },
  messageBanner: {
    padding: '12px 16px',
    marginBottom: '24px',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: '600',
    border: '1px solid',
    textAlign: 'center',
  },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#94a3b8',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: 'rgba(2, 6, 23, 0.8)',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  showPassBtn: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
  },
  button: {
    width: '100%',
    marginTop: '8px',
    backgroundColor: '#059669',
    color: '#ffffff',
    fontWeight: '600',
    padding: '14px 16px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    boxShadow: '0 10px 15px -3px rgba(5, 150, 105, 0.3)',
  },
  secondaryButton: {
    padding: '10px 20px',
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    fontSize: '12px',
    fontWeight: '600',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
  },
  otpInput: {
    width: '42px',
    height: '48px',
    textAlign: 'center',
    fontSize: '18px',
    fontWeight: 'bold',
    backgroundColor: 'rgba(2, 6, 23, 0.9)',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    color: '#ffffff',
    outline: 'none',
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontSize: '12px',
    padding: 0,
  },
  socialButton: {
    backgroundColor: 'rgba(2, 6, 23, 0.9)',
    color: '#cbd5e1',
    border: '1px solid #1e293b',
    padding: '10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
};
/**
 * Ultra-Modern Auth Container with sophisticated animations
 * @author Matteo Owona, Rouchda Yampen
 * @date 2024-12-07
 */

'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/lib/auth/auth';
import './auth-modern.css';
import Link from 'next/link';
import { GoogleLoginButton } from './google-login-button';

export function AuthContainer() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const formattedEmail = loginData.email.trim().toLowerCase();
      const formattedPassword = loginData.password.trim();

      const result = await signIn('credentials', {
        email: formattedEmail,
        password: formattedPassword,
        redirect: false,
        callbackUrl: '/home'
      });

      if (result?.error) {
        setError('Email ou mot de passe incorrect');
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        window.location.href = '/home';
        return;
      }

      setError('Erreur de connexion');
      setIsLoading(false);

    } catch (err) {
      setError('Une erreur est survenue');
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (registerData.password !== registerData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (registerData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsLoading(true);

    try {
      const normalizedEmail = registerData.email.trim().toLowerCase();
      const normalizedName = registerData.name.trim();

      const registerResult = await registerUser(
        normalizedEmail,
        registerData.password,
        normalizedName
      );

      if (!registerResult.success) {
        setError(registerResult.error || 'Erreur lors de la création du compte');
        setIsLoading(false);
        return;
      }

      // Attendre la synchronisation avant l'auto-login
      await new Promise((resolve) => setTimeout(resolve, 1500));

      let result = await signIn('credentials', {
        email: normalizedEmail,
        password: registerData.password,
        redirect: false,
        callbackUrl: '/home'
      });

      // Retry une fois si échec
      if (result?.error) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        result = await signIn('credentials', {
          email: normalizedEmail,
          password: registerData.password,
          redirect: false,
          callbackUrl: '/home'
        });
      }

      if (result?.ok) {
        setIsLoading(false);
        setRegisterData({ name: '', email: '', password: '', confirmPassword: '' });
        window.location.href = '/home';
        return;
      }

      if (result?.error) {
        setIsSignUp(false);
        setLoginData({ email: normalizedEmail, password: '' });
        setIsLoading(false);
        return;
      }

    } catch (err) {
      setError('Erreur lors de l\'inscription');
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-modern-wrapper">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className={`auth-modern-container ${isSignUp ? 'signup-active' : ''}`}>
        {/* Toggle Tabs */}
        <div className="auth-tabs">
          <button
            onClick={() => { setIsSignUp(false); setError(''); }}
            className={`tab-button ${!isSignUp ? 'active' : ''}`}
          >
            Connexion
          </button>
          <button
            onClick={() => { setIsSignUp(true); setError(''); }}
            className={`tab-button ${isSignUp ? 'active' : ''}`}
          >
            Inscription
          </button>
          <div className="tab-indicator"></div>
        </div>

        {/* Forms Container */}
        <div className="forms-container">
          {/* Login Form */}
          <div className={`form-card login-form ${!isSignUp ? 'active' : ''}`}>
            <div className="form-header">
              <h1 className="form-title">
                <span className="gradient-text">Bon retour !</span>
              </h1>
              <p className="form-subtitle">Connectez-vous pour continuer votre aventure</p>
            </div>

            {/* Demo Credentials */}
            <div className="mb-6">
              <GoogleLoginButton />
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Ou avec email</span>
              </div>
            </div>


            {error && !isSignUp && (
              <div className="error-alert">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="auth-form">
              <div className="input-wrapper">
                <label className="input-label">Email</label>
                <div className="input-container">
                  <input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    placeholder="votre@email.com"
                    required
                    className="modern-input"
                  />
                </div>
              </div>

              <div className="input-wrapper">
                <label className="input-label">Mot de passe</label>
                <div className="input-container">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    className="modern-input"
                    style={{ paddingRight: '50px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
                    tabIndex={-1}
                  >
                    {showLoginPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span>Se souvenir de moi</span>
                </label>
                <Link href="/auth/forgot-password" className="forgot-link">
                  Mot de passe oublié ?
                </Link>
              </div>

              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Connexion...
                  </>
                ) : (
                  <>
                    Se connecter
                    <span className="btn-arrow">→</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Register Form */}
          <div className={`form-card register-form ${isSignUp ? 'active' : ''}`}>
            <div className="form-header">
              <h1 className="form-title">
                <span className="gradient-text">Rejoignez-nous !</span>
              </h1>
              <p className="form-subtitle">Créez votre compte en quelques secondes</p>
            </div>

            <div className="mb-6">
              <GoogleLoginButton />
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Ou avec email</span>
              </div>
            </div>

            {error && isSignUp && (
              <div className="error-alert">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="auth-form">
              <div className="input-wrapper">
                <label className="input-label">Nom complet</label>
                <div className="input-container">
                  <span className="input-icon">👤</span>
                  <input
                    type="text"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    placeholder="Rouchda Yampen"
                    required
                    className="modern-input"
                  />
                </div>
              </div>

              <div className="input-wrapper">
                <label className="input-label">Email</label>
                <div className="input-container">
                  <input
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    placeholder="votre@email.com"
                    required
                    className="modern-input"
                  />
                </div>
              </div>

              <div className="input-wrapper">
                <label className="input-label">Mot de passe</label>
                <div className="input-container">
                  <input
                    type={showRegisterPassword ? 'text' : 'password'}
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    className="modern-input"
                    style={{ paddingRight: '50px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
                    tabIndex={-1}
                  >
                    {showRegisterPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <span className="input-helper">Au moins 6 caractères</span>
              </div>

              <div className="input-wrapper">
                <label className="input-label">Confirmer le mot de passe</label>
                <div className="input-container">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    required
                    className="modern-input"
                    style={{ paddingRight: '50px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <label className="checkbox-label terms-check">
                <input type="checkbox" required />
                <span>J&apos;accepte les conditions d&apos;utilisation</span>
              </label>

              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Création...
                  </>
                ) : (
                  <>
                    Créer mon compte
                    <span className="btn-arrow">→</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** Formulaire de contact — isolé en client component pour que la page /contact
 * reste un Server Component (metadata propre, contenu indexable). */
export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simuler l'envoi
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setSubmitted(true);
    setIsSubmitting(false);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Message envoyé !</h3>
        <p className="text-gray-600 mb-4">
          Nous vous répondrons dans les plus brefs délais.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="text-blue-600 hover:text-blue-800 font-semibold"
        >
          Envoyer un autre message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Nom complet"
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
        placeholder="Votre nom"
      />

      <Input
        label="Email"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        required
        placeholder="votre@email.com"
      />

      <Input
        label="Sujet"
        type="text"
        name="subject"
        value={formData.subject}
        onChange={handleChange}
        required
        placeholder="Objet de votre message"
      />

      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Message
        </label>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          rows={6}
          placeholder="Votre message..."
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 outline-none transition-all resize-none"
        />
      </div>

      <Button type="submit" variant="primary" fullWidth isLoading={isSubmitting}>
        Envoyer le message
      </Button>
    </form>
  );
}

'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { searchService } from '@/lib/api/search-service';

interface QuestionItem {
  question: string;
  answer: string;
}

interface PeopleAlsoAskProps {
  query: string;
  city?: string;
}

export function PeopleAlsoAsk({ query, city }: PeopleAlsoAskProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Repli statique : questions affichées immédiatement et si la génération Groq échoue.
  const fallbackQuestions = useMemo<QuestionItem[]>(() => {
    const term = query?.trim();
    const hasQuery = !!term && term.toLowerCase() !== 'yowyob';
    return hasQuery
      ? [
          {
            question: `Comment choisir le bon résultat pour « ${term} » ?`,
            answer: `Trie les résultats par note et par proximité : les commerces les mieux notés et les plus proches de toi remontent en premier. Ouvre quelques fiches pour comparer les avis, les horaires et l'adresse avant de choisir.`,
          },
          {
            question: `Comment contacter le commerce ou s'y rendre ?`,
            answer: `Chaque fiche affiche le téléphone et le site web. Le bouton « Aller à » lance l'itinéraire vers le commerce depuis ta position.`,
          },
          {
            question: `Que signifie le badge « Annuaire officiel » ?`,
            answer: `Il identifie les commerces vérifiés, issus de l'annuaire officiel. Ces résultats sont affichés en priorité, en haut de la liste.`,
          },
        ]
      : [
          {
            question: `Comment trouver un commerce près de chez moi ?`,
            answer: `Tape ce que tu cherches dans la barre de recherche, puis trie par proximité. Sur chaque fiche, le bouton « Aller à » lance l'itinéraire directement depuis ta position.`,
          },
          {
            question: `Comment comparer les commerces ?`,
            answer: `Chaque fiche affiche la note, le nombre d'avis, les horaires et le téléphone. Trie par note pour voir les mieux évalués en premier.`,
          },
          {
            question: `Que signifie le badge « Annuaire officiel » ?`,
            answer: `Il identifie les commerces vérifiés, issus de l'annuaire officiel. Ces résultats sont mis en avant, en haut de la liste.`,
          },
        ];
  }, [query]);

  const [questions, setQuestions] = useState<QuestionItem[]>(fallbackQuestions);

  // Génère les Q/R dynamiquement via le backend (Groq). Repli silencieux sur le statique.
  useEffect(() => {
    let cancelled = false;
    setOpenIndex(null);
    setQuestions(fallbackQuestions); // affichage immédiat le temps de la génération
    searchService
      .getFaq(query || '', city)
      .then((items) => {
        if (!cancelled && items.length > 0) setQuestions(items);
      })
      .catch(() => {
        /* repli déjà en place */
      });
    return () => {
      cancelled = true;
    };
  }, [query, city, fallbackQuestions]);

  return (
    <div className="mb-6 py-4 bg-white dark:bg-gray-800 border border-[#dadce0] dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-4 pb-2 border-b border-[#dadce0] dark:border-gray-700">
        <h3 className="text-[16px] font-medium text-[#202124] dark:text-white">
          Autres questions posées
        </h3>
      </div>

      <div className="divide-y divide-[#dadce0] dark:divide-gray-700">
        {questions.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="px-4 py-3 bg-white dark:bg-gray-800">
              <button
                className="w-full flex items-center justify-between text-left text-[14px] text-[#202124] dark:text-white hover:text-blue-600 transition-colors"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
              >
                <span>{item.question}</span>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {isOpen && (
                <div className="mt-2 text-[13px] text-[#4d5156] dark:text-gray-300 leading-relaxed border-t border-[#f1f3f4] dark:border-gray-700 pt-2 animate-fadeIn">
                  <p>{item.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Legal Notice Page
 * @author Matteo Owona, Rouchda Yampen
 */

import type { Metadata } from 'next';
import { ConditionalLayout } from '@/components/layout/conditional-layout';

const TITLE = 'Mentions légales — Yowyob Search';
const DESCRIPTION = 'Informations légales relatives à l\'éditeur, l\'hébergeur et la publication de Yowyob Search.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://search.yowyob.com/mentions-legales',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function MentionsLegalesPage() {
  return (
    <ConditionalLayout>
      <div className="min-h-screen py-20 px-6 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-8 text-gray-900 dark:text-gray-100">
            Mentions Légales
          </h1>

          <div className="prose prose-lg max-w-none space-y-8 text-gray-700 dark:text-gray-300">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Dernière mise à jour : 26 juillet 2026 — Applicables à l&apos;ensemble des plateformes
              web et mobiles exploitées sous le domaine yowyob.com par Yowyob Inc. Ltd, dont
              Yowyob Search.
            </p>

            <section>
              <h2 className="text-3xl font-bold mb-4 text-gray-900">1. Éditeur du site</h2>
              <ul className="space-y-2 ml-6 list-disc">
                <li><strong>Dénomination sociale :</strong> Yowyob Inc. Ltd</li>
                <li><strong>Forme juridique :</strong> Société à responsabilité limitée de droit camerounais</li>
                <li><strong>Siège social :</strong> Lieudit Carrefour Anguissa, Yaoundé, Cameroun ; S/C Yaoundé 1er, Rue 1.121 Djoungolo</li>
                <li><strong>Capital social :</strong> 1 000 000 FCFA</li>
                <li><strong>Registre du Commerce :</strong> RC/YAO/2020/B/1614</li>
                <li><strong>Numéro d&apos;Identification Fiscale (NIF) :</strong> M102015282478U</li>
                <li><strong>Téléphone :</strong> +237 675 518 880</li>
                <li><strong>E-mail :</strong> info@yowyob.com</li>
              </ul>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4 text-gray-900">2. Directeur·rice de la publication</h2>
              <p>
                Thomas Djotio Ndié, Chief Executive Officer (CEO) — <a href="mailto:ceo@yowyob.com" className="text-blue-600 hover:text-blue-800 font-semibold">ceo@yowyob.com</a>
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4 text-gray-900">3. Hébergeur</h2>
              <ul className="space-y-2 ml-6 list-disc">
                <li><strong>Société :</strong> OVHcloud SAS</li>
                <li><strong>Adresse :</strong> 2 Rue Kellermann, 59100 Roubaix, France</li>
                <li><strong>Téléphone :</strong> +33 9 72 10 10 07</li>
                <li><strong>Site web :</strong> https://www.ovhcloud.com</li>
              </ul>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4 text-gray-900">4. Propriété intellectuelle</h2>
              <p>
                L&apos;ensemble des contenus présents sur Yowyob Search (textes, images, graphismes,
                logos, icônes, code, bases de données) sont protégés au titre du droit d&apos;auteur
                et du droit des marques. Toute reproduction, représentation, diffusion ou
                exploitation, totale ou partielle, sans autorisation écrite préalable de Yowyob
                est strictement interdite. Vous pouvez copier des portions limitées du contenu à
                des fins d&apos;information et non commerciales, à condition de ne pas les modifier,
                de ne pas retirer les mentions de droits d&apos;auteur et d&apos;inclure une notice
                renvoyant à Yowyob Inc. Ltd.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4 text-gray-900">5. Protection des données personnelles</h2>
              <p>
                Yowyob collecte et traite vos données conformément à sa{' '}
                <a href="/privacy" className="text-blue-600 hover:text-blue-800 font-semibold">Politique de confidentialité</a>.
                Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement et
                d&apos;opposition que vous pouvez exercer auprès de notre Délégué à la Protection des
                Données à <a href="mailto:privacy@yowyob.com" className="text-blue-600 hover:text-blue-800 font-semibold">privacy@yowyob.com</a> ou par téléphone au +237 675 518 880.
                Le régulateur compétent au Cameroun est l&apos;ANTIC (Agence Nationale des Technologies
                de l&apos;Information et de la Communication).
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4 text-gray-900">6. Gestion des cookies</h2>
              <p>
                Pour plus d&apos;informations sur l&apos;usage des cookies et technologies similaires,
                veuillez consulter la section dédiée de notre{' '}
                <a href="/privacy" className="text-blue-600 hover:text-blue-800 font-semibold">Politique de confidentialité</a>.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4 text-gray-900">7. Responsabilité</h2>
              <p>
                Yowyob met tout en œuvre pour offrir des informations fiables et une disponibilité
                continue de ses services. Toutefois, Yowyob ne saurait être tenu responsable des
                interruptions du service pour maintenance ou mise à jour, des dommages résultant
                d&apos;une intrusion frauduleuse d&apos;un tiers, des imprécisions ou omissions portant
                sur les informations disponibles, ni d&apos;éventuels dysfonctionnements liés au
                réseau Internet ou à l&apos;infrastructure locale.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4 text-gray-900">8. Liens hypertextes</h2>
              <p>
                Yowyob Search peut contenir des liens vers des sites tiers (commerces, produits
                référencés). Yowyob n&apos;exerce aucun contrôle sur ces sites et décline toute
                responsabilité quant à leur contenu ou à leur politique de confidentialité.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4 text-gray-900">9. Droit applicable et juridictions compétentes</h2>
              <p>
                Les présentes mentions légales sont régies par le droit camerounais. Tout litige
                sera porté devant les tribunaux compétents de Yaoundé, sous réserve des
                dispositions légales impératives.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4 text-gray-900">10. Modification des mentions légales</h2>
              <p>
                Yowyob se réserve le droit de modifier les présentes mentions légales à tout
                moment. Les utilisateurs sont invités à les consulter régulièrement.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-4 text-gray-900">11. Contact</h2>
              <ul className="space-y-2 ml-6 list-disc">
                <li>Service juridique : <a href="mailto:legal@yowyob.com" className="text-blue-600 hover:text-blue-800 font-semibold">legal@yowyob.com</a></li>
                <li>Service technique : <a href="mailto:support@yowyob.com" className="text-blue-600 hover:text-blue-800 font-semibold">support@yowyob.com</a></li>
                <li>Téléphone : +237 675 518 880</li>
              </ul>
              <p className="mt-4 mb-2">Réseaux sociaux :</p>
              <ul className="space-y-1 ml-6 list-disc">
                <li><a href="https://twitter.com/yowyob" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-semibold">twitter.com/yowyob</a></li>
                <li><a href="https://www.facebook.com/YowyobInc" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-semibold">facebook.com/YowyobInc</a></li>
                <li><a href="https://www.instagram.com/yowyob" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-semibold">instagram.com/yowyob</a></li>
                <li><a href="https://linkedin.com/yowyob" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-semibold">linkedin.com/yowyob</a></li>
              </ul>
              <p className="mt-4">© {new Date().getFullYear()} Yowyob Inc. Ltd. Tous droits réservés.</p>
            </section>
          </div>
        </div>
      </div>
    </ConditionalLayout>
  );
}

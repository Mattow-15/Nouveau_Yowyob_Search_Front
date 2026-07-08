import { handlers } from "@/lib/auth/auth"

// Empêche Next.js de tenter une pré-génération statique au build :
// NEXTAUTH_SECRET n'est disponible qu'à l'exécution, pas au build time.
export const dynamic = 'force-dynamic'

export const { GET, POST } = handlers

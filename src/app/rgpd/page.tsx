import Link from "next/link";

export const metadata = { title: "Confidentialité & RGPD — IBKM" };

export default function RgpdPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 prose prose-slate">
      <h1>Politique de confidentialité</h1>
      <p>
        L'association IBKM met à disposition cette plateforme pour faciliter
        la communication avec les familles et les jeunes. Cette page décrit les
        données traitées et vos droits au titre du RGPD.
      </p>

      <h2>Données collectées</h2>
      <ul>
        <li>Identité : prénom, nom, date de naissance (pour les jeunes), téléphone facultatif.</li>
        <li>Compte : email, rôle (administrateur / parent / jeune).</li>
        <li>Contenus : messages, photos et documents que vous publiez.</li>
        <li>Consentements : autorisation parentale pour la diffusion des photos.</li>
      </ul>

      <h2>Données concernant les mineurs</h2>
      <p>
        Les comptes des jeunes mineurs sont créés à la demande des parents. Un
        parent peut à tout moment demander la suppression du compte de son
        enfant. Les messages des jeunes ne sont autorisés qu'avec les
        responsables de l'association.
      </p>

      <h2>Base légale</h2>
      <p>
        Le traitement est fondé sur l'exécution de l'activité associative et,
        pour les photos, sur le consentement explicite des parents.
      </p>

      <h2>Vos droits</h2>
      <p>
        Vous disposez d'un droit d'accès, de rectification, d'effacement,
        d'opposition et de portabilité. Pour exercer ces droits, contactez
        l'administrateur de l'association.
      </p>

      <h2>Conservation</h2>
      <p>
        Les données sont conservées pendant la durée d'inscription à l'association.
        Sur demande de suppression, le compte et les contenus associés sont
        effacés sous 30 jours.
      </p>

      <p><Link href="/login">← Retour</Link></p>
    </div>
  );
}

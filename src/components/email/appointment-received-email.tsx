import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "react-email";

type AppointmentReceivedEmailProps = {
  name: string;
  service: string;
  startLabel: string;
  statusLabel: string;
  publicReferenceCode: string;
  resumeUrl: string;
  requiresIntake: boolean;
};

export function AppointmentReceivedEmail({
  name,
  service,
  startLabel,
  statusLabel,
  publicReferenceCode,
  resumeUrl,
  requiresIntake,
}: AppointmentReceivedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Statusul programarii si codul tau de verificare</Preview>
      <Body style={{ fontFamily: "Open Sans, Arial, sans-serif", backgroundColor: "#f7fbfc" }}>
        <Container style={{ maxWidth: "620px", margin: "0 auto", padding: "32px" }}>
          <Section
            style={{
              borderRadius: "24px",
              backgroundColor: "#ffffff",
              padding: "32px",
              border: "1px solid #dbe6ec",
            }}
          >
            <Heading style={{ color: "#293039" }}>Programarea ta a fost inregistrata</Heading>
            <Text>Buna, {name}.</Text>
            <Text>
              Am inregistrat programarea pentru <b>{service}</b>, in data de <b>{startLabel}</b>.
            </Text>
            <Text>
              Status actual: <b>{statusLabel}</b>.
            </Text>
            <Text>
              Codul tau de verificare este <b>{publicReferenceCode}</b>. Il poti folosi impreuna cu
              emailul pentru a relua programarea daca inchizi pagina sau schimbi dispozitivul.
            </Text>
            {requiresIntake ? (
              <Text>
                Pentru prima vizita, Chestionarul Evaluare Nutritionala trebuie completat dupa
                rezervare. Daca il intrerupi, il poti relua din pagina de status.
              </Text>
            ) : null}
            <Button
              href={resumeUrl}
              style={{
                display: "inline-block",
                marginTop: "12px",
                borderRadius: "999px",
                backgroundColor: "#293039",
                color: "#ffffff",
                padding: "14px 22px",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Verifica programarea
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

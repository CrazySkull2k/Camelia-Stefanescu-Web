import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "react-email";

type AppointmentIntakeCompletedEmailProps = {
  name: string;
  service: string;
  startLabel: string;
};

export function AppointmentIntakeCompletedEmail({
  name,
  service,
  startLabel,
}: AppointmentIntakeCompletedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Chestionarul Evaluare Nutritionala a fost completat</Preview>
      <Body style={{ backgroundColor: "#f4f1ea", fontFamily: "Arial, sans-serif" }}>
        <Container
          style={{
            maxWidth: "640px",
            margin: "0 auto",
            backgroundColor: "#ffffff",
            padding: "32px",
          }}
        >
          <Heading style={{ color: "#1f2937", fontSize: "28px" }}>
            Chestionar completat
          </Heading>
          <Text>Buna, {name},</Text>
          <Text>
            Am primit Chestionarul Evaluare Nutritionala pentru programarea ta la <b>{service}</b>.
          </Text>

          <Section
            style={{
              marginTop: "24px",
              border: "1px solid #e5e7eb",
              borderRadius: "16px",
              padding: "20px",
            }}
          >
            <Text style={{ margin: "0 0 8px", fontWeight: 700 }}>Programare: {startLabel}</Text>
            <Text style={{ margin: 0 }}>
              Totul este pregatit. Daca va mai fi nevoie de clarificari, cabinetul te va contacta.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

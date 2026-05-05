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

type AppointmentStatusEmailProps = {
  name: string;
  service: string;
  startLabel: string;
  statusLabel: string;
  message: string;
};

export function AppointmentStatusEmail({
  name,
  service,
  startLabel,
  statusLabel,
  message,
}: AppointmentStatusEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Actualizare pentru programarea ta</Preview>
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
            Actualizare programare
          </Heading>
          <Text>Buna, {name},</Text>
          <Text>{message}</Text>

          <Section
            style={{
              marginTop: "24px",
              border: "1px solid #e5e7eb",
              borderRadius: "16px",
              padding: "20px",
            }}
          >
            <Text style={{ margin: "0 0 8px", fontWeight: 700 }}>Serviciu: {service}</Text>
            <Text style={{ margin: "0 0 8px" }}>Programare: {startLabel}</Text>
            <Text style={{ margin: 0 }}>Status: {statusLabel}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

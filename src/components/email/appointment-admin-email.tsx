import { Body, Container, Head, Heading, Html, Preview, Section, Text } from "react-email";

type AppointmentAdminEmailProps = {
  name: string;
  email: string;
  phone: string;
  service: string;
  startLabel: string;
  statusLabel: string;
  publicReferenceCode: string;
  intakeStatusLabel: string;
  isFirstVisit: boolean;
};

export function AppointmentAdminEmail(props: AppointmentAdminEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Programare noua in platforma</Preview>
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
            <Heading style={{ color: "#293039" }}>Programare noua</Heading>
            <Text>
              <b>Pacient:</b> {props.name}
            </Text>
            <Text>
              <b>Email:</b> {props.email}
            </Text>
            <Text>
              <b>Telefon:</b> {props.phone}
            </Text>
            <Text>
              <b>Serviciu:</b> {props.service}
            </Text>
            <Text>
              <b>Data:</b> {props.startLabel}
            </Text>
            <Text>
              <b>Status:</b> {props.statusLabel}
            </Text>
            <Text>
              <b>Prima vizita:</b> {props.isFirstVisit ? "Da" : "Nu"}
            </Text>
            <Text>
              <b>Chestionar:</b> {props.intakeStatusLabel}
            </Text>
            <Text>
              <b>Cod verificare:</b> {props.publicReferenceCode}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

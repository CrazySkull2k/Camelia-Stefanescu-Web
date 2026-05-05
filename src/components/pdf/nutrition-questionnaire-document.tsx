import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  title: {
    fontSize: 18,
    marginBottom: 18,
    color: "#293039",
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 13,
    marginBottom: 8,
    color: "#26aba3",
  },
  row: {
    marginBottom: 6,
  },
  label: {
    fontWeight: 700,
  },
});

type NutritionQuestionnaireDocumentProps = {
  patientName: string;
  submittedAt: string;
  answers: Array<{ label: string; value: string }>;
};

export function NutritionQuestionnaireDocument({
  patientName,
  submittedAt,
  answers,
}: NutritionQuestionnaireDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>Chestionar evaluare nutritionala</Text>
          <Text>Pacient: {patientName}</Text>
          <Text>Data completarii: {submittedAt}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Raspunsuri</Text>
          {answers.map((answer) => (
            <View style={styles.row} key={`${answer.label}-${answer.value}`}>
              <Text>
                <Text style={styles.label}>{answer.label}: </Text>
                {answer.value}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SelectPageScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [showModal, setShowModal] = useState<boolean>(false);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Page</Text>
        </View>
        <View style={styles.pageBadge}>
          <Text style={styles.pageBadgeText}>10pages</Text>
        </View>
      </View>

      {/* Document Area */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageNumber}>Page 5</Text>
          <View style={styles.dot} />
        </View>

        <View style={styles.documentCard}>
          <Text style={styles.docHeading}>Word</Text>
          <Text style={styles.docText}>
            From the Table properties menu, you can also set the dimensions and alignment for the tables and choose a background color for your cells, which we did for the left column to add a little pop to the resume.
          </Text>
          <Text style={styles.docText}>
            Lastly, you'll want to get rid of the table borders so they look like true columns. To do this, go to Table properties and change the Table border to 0 pt.
          </Text>
          <Text style={styles.docText}>
            For our purposes, Google Docs tables were a surprisingly easy workaround for creating a multi-column document. But it's important to remember it's just that: a workaround. Though they will work for resumes and likely any other tightly formatted document, Docs tables Creating a newsletter won't work, text can't flow from one column to the next and around images like in Word.
          </Text>
          <Text style={[styles.docHeading, { marginTop: 15 }]}>Google Docs</Text>
          <Text style={styles.docText}>
            We ran into some frustration out of the box when we went to create a header. Whereas Google Docs intuitively placed this feature under its Insert menu, Word treats headers and footers like they're already present in a blank document. A quick help search reminded us they can be revealed from the View menu: View {'->'} Header and Footer.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={() => setShowModal(true)}
        >
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </View>

      {/* Detail Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detail</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.separator} />

            <View style={styles.infoGrid}>
              <InfoItem label="Name" value="Jansen.Pdf" />
              <InfoItem label="Selected Pages" value="1,4,5,6,7,10" />
              <InfoItem label="Paper" value="A4" />
              <InfoItem label="Side" value="Single" />
              <InfoItem label="Quantity" value="4" />
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.priceText}>RS-240</Text>
            </View>

            <TouchableOpacity 
              style={styles.modalNextButton}
              onPress={() => {
                setShowModal(false);
                // The user said: "UploadDocumentPage.tas file popup varanum"
                // which implies returning to UploadDocument and showing something there.
                // For now, let's navigate back with a param.
                navigation.navigate('UploadDocument', { showFinalPopup: true });
              }}
            >
              <Text style={styles.modalNextText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const InfoItem = ({ label, value }: { label: string, value: string }) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#333',
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  pageBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pageBadgeText: {
    color: '#1B5E3B',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pageNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F5A623',
  },
  documentCard: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 20,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  docHeading: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  docText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    textAlign: 'justify',
    marginBottom: 10,
  },
  bottomBar: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  continueButton: {
    backgroundColor: '#F5A623',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  continueText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: Dimensions.get('window').width * 0.8,
    padding: 20,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  closeIcon: {
    fontSize: 20,
    color: '#888',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  infoItem: {
    width: '50%',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  priceText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000',
  },
  modalNextButton: {
    backgroundColor: '#F5A623',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  modalNextText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default SelectPageScreen;


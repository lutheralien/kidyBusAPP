import { COLORS } from "@/src/constants/theme";
import React from "react";
import { Modal, View, ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Parent {
    _id: string;
    name: string;
    phone: string;
    location?: {
      type: string;
      coordinates: number[];
      place: string;
    };
  }

  
interface Student {
    _id: string;
    name: string;
    class: string;
    parent: Parent;
    stopStatus?: string;
    actualTime?: string;
    _stopId?: string;
  }

const StudentSelectionModal = ({
    visible,
    onClose,
    students,
    onSelectStudent,
    stop
  }) => {
    console.log('selectedStop',stop);
    
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.selectionModalOverlay}>
          <View style={styles.selectionModalContent}>
            <View style={styles.selectionModalHeader}>
              <Text style={styles.selectionModalTitle}>Select Student to Update</Text>
              <Text style={styles.selectionModalSubtitle}>
                Choose which student's status you want to update:
              </Text>
            </View>
            
            <ScrollView style={styles.selectionModalList}>
              {students.map((student: Student) => (
                <TouchableOpacity
                  key={student._id}
                  style={styles.selectionModalItem}
                  onPress={() => {
                    onSelectStudent(stop, student);
                    onClose();
                  }}
                >
                  <View style={styles.selectionStudentInfo}>
                    <View style={styles.selectionStudentAvatar}>
                      <Ionicons name="school-outline" size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.selectionStudentDetails}>
                      <Text style={styles.selectionStudentName}>{student.name}</Text>
                      <Text style={styles.selectionStudentClass}>{student.class}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.selectionModalCancelButton}
              onPress={onClose}
            >
              <Text style={styles.selectionModalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

const styles = StyleSheet.create({
  selectionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  selectionModalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '100%',
    maxHeight: '80%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  selectionModalHeader: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  selectionModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5
  },
  selectionModalSubtitle: {
    fontSize: 14,
    color: '#666'
  },
  selectionModalList: {
    maxHeight: 400
  },
  selectionModalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  selectionStudentInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  selectionStudentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  selectionStudentDetails: {
    flex: 1
  },
  selectionStudentName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 3
  },
  selectionStudentClass: {
    fontSize: 14,
    color: '#777'
  },
  selectionModalCancelButton: {
    marginTop: 15,
    paddingVertical: 12,
    backgroundColor: '#f2f2f2',
    borderRadius: 5,
    alignItems: 'center'
  },
  selectionModalCancelText: {
    color: COLORS.primary,
    fontWeight: '500',
    fontSize: 16
  }
});

export default StudentSelectionModal;
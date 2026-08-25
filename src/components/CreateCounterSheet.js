import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../assets/color';
import { FONT, FONT_WEIGHT } from '../constants/typography';

const CreateCounterSheet = ({ visible, onClose, onSave, counter = null }) => {
  const { t } = useTranslation();
  const isEditing = !!counter;
  const [name, setName] = useState('');
  const [count, setCount] = useState('');
  const [lapLimit, setLapLimit] = useState('33');

  useEffect(() => {
    if (visible) {
      if (counter) {
        setName(counter.label);
        setCount(String(counter.initialCount ?? 0));
        setLapLimit(String(counter.target));
      } else {
        setName('');
        setCount('');
        setLapLimit('33');
      }
    }
  }, [visible, counter]);

  const handleSave = () => {
    const trimmedName = name.trim();
    const parsedTarget = parseInt(lapLimit, 10);
    const parsedCount = count.trim() === '' ? 0 : parseInt(count, 10);

    if (!trimmedName || Number.isNaN(parsedTarget) || parsedTarget <= 0) {
      return;
    }
    if (Number.isNaN(parsedCount) || parsedCount < 0) {
      return;
    }

    onSave({
      ...(counter ? { id: counter.id } : {}),
      label: trimmedName,
      initialCount: parsedCount,
      target: parsedTarget,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.centerWrap} pointerEvents="box-none">
          <View style={styles.sheet}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <Text style={styles.title}>
                {isEditing
                  ? t('createCounter.editTitle')
                  : t('createCounter.createTitle')}
              </Text>

              <TextInput
                style={styles.input}
                placeholder={t('createCounter.namePlaceholder')}
                placeholderTextColor={COLORS.gray}
                value={name}
                onChangeText={setName}
              />

              <TextInput
                style={styles.input}
                placeholder={t('createCounter.countPlaceholder')}
                placeholderTextColor={COLORS.gray}
                value={count}
                onChangeText={setCount}
                keyboardType="number-pad"
                maxLength={6}
              />

              <View style={styles.labeledField}>
                <Text style={styles.fieldLabel}>
                  {t('createCounter.lapLimitPlaceholder')}
                </Text>
                <TextInput
                  style={styles.labeledInput}
                  value={lapLimit}
                  onChangeText={setLapLimit}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                activeOpacity={0.9}
              >
                <Text style={styles.saveButtonText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CreateCounterSheet;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 22,
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  title: {
    fontSize: FONT.lg,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primaryDark,
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: FONT.body,
    color: '#111111',
    marginBottom: 14,
  },
  labeledField: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
    marginBottom: 22,
  },
  fieldLabel: {
    fontSize: FONT.caption,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.medium,
    marginBottom: 4,
  },
  labeledInput: {
    fontSize: FONT.lg,
    color: '#111111',
    padding: 0,
  },
  saveButton: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: FONT.body,
    fontWeight: FONT_WEIGHT.semibold,
  },
});

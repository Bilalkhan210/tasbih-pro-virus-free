import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../assets/color';
import { BG_IMAGE_OPACITY } from '../constants/theme';
import { FONT, FONT_WEIGHT } from '../constants/typography';
import { useSettings } from '../context/SettingsContext';
import { useAppDirection } from '../hooks/useAppDirection';
import LocalizedText from '../components/LocalizedText';
import { getLanguageNativeName } from '../utils/language';
import {
  SettingsSection,
  SettingsToggleRow,
  SettingsLinkRow,
} from '../components/SettingsRows';

const Settings = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { settings, updateSetting } = useSettings();
  const { backIcon } = useAppDirection();

  return (
    <ImageBackground
      source={require('../assets/images/bg.png')}
      style={styles.root}
      imageStyle={styles.bgImage}
      resizeMode="cover"
    >
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name={backIcon} size={24} color="#111111" />
          </TouchableOpacity>
          <LocalizedText center style={styles.screenTitle}>
            {t('settings.title')}
          </LocalizedText>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <SettingsSection title={t('settings.general')}>
            <SettingsLinkRow
              icon="language-outline"
              label={t('settings.changeLanguage')}
              value={getLanguageNativeName(settings.language)}
              onPress={() => navigation.navigate('ChangeLanguage')}
            />
            <SettingsToggleRow
              icon="notifications-outline"
              label={t('settings.notificationReminder')}
              value={settings.notificationReminder}
              onValueChange={(value) => updateSetting('notificationReminder', value)}
              isLast
            />
          </SettingsSection>

          <SettingsSection title={t('settings.controls')}>
            <SettingsToggleRow
              icon="volume-high-outline"
              label={t('settings.roundCompleteSound')}
              value={settings.roundCompleteSound}
              onValueChange={(value) => updateSetting('roundCompleteSound', value)}
            />
            <SettingsToggleRow
              icon="volume-high-outline"
              label={t('settings.countSound')}
              value={settings.countSound}
              onValueChange={(value) => updateSetting('countSound', value)}
            />
            <SettingsToggleRow
              icon="phone-portrait-outline"
              label={t('settings.roundCompleteVibration')}
              value={settings.roundCompleteVibration}
              onValueChange={(value) =>
                updateSetting('roundCompleteVibration', value)
              }
            />
            <SettingsToggleRow
              icon="phone-portrait-outline"
              label={t('settings.countVibration')}
              value={settings.countVibration}
              onValueChange={(value) => updateSetting('countVibration', value)}
            />
            <SettingsToggleRow
              icon="volume-medium-outline"
              label={t('settings.volumeButtonControl')}
              value={settings.volumeButtonControl}
              onValueChange={(value) => updateSetting('volumeButtonControl', value)}
              isLast
            />
          </SettingsSection>

          <SettingsSection title={t('settings.display')}>
            <SettingsToggleRow
              icon="alert-circle-outline"
              label={t('settings.roundCompleteAlert')}
              value={settings.roundCompleteAlert}
              onValueChange={(value) => updateSetting('roundCompleteAlert', value)}
            />
            <SettingsToggleRow
              icon="timer-outline"
              label={t('settings.timer')}
              value={settings.showTimer}
              onValueChange={(value) => updateSetting('showTimer', value)}
            />
            <SettingsToggleRow
              icon="flash-outline"
              label={t('settings.autoCounter')}
              value={settings.showAutoCounter}
              onValueChange={(value) => updateSetting('showAutoCounter', value)}
            />
            <SettingsToggleRow
              icon="text-outline"
              label={t('settings.showCounterName')}
              value={settings.showCounterName}
              onValueChange={(value) => updateSetting('showCounterName', value)}
            />
            <SettingsToggleRow
              icon="refresh-circle-outline"
              label={t('settings.rounds')}
              value={settings.showRounds}
              onValueChange={(value) => updateSetting('showRounds', value)}
            />
            <SettingsToggleRow
              icon="ellipse-outline"
              label={t('settings.lapLimit')}
              value={settings.showLapLimit}
              onValueChange={(value) => updateSetting('showLapLimit', value)}
              isLast
            />
          </SettingsSection>
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

export default Settings;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
  },
  bgImage: {
    opacity: BG_IMAGE_OPACITY,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: FONT.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: '#111111',
  },
  scrollContent: {
    paddingBottom: 24,
  },
});

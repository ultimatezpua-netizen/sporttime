import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FONTS } from '@/constants/typography';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.title}>Щось пішло не так</Text>
            <Text style={styles.subtitle}>
              Виникла неочікувана помилка в роботі додатка. Ви можете спробувати оновити сторінку.
            </Text>
            {this.state.error?.message ? (
              <Text style={styles.errorDetail} numberOfLines={2}>
                {this.state.error.message}
              </Text>
            ) : null}
            <Pressable
              style={({ pressed }) => [styles.resetBtn, pressed && styles.resetBtnPressed]}
              onPress={this.handleReset}
            >
              <Text style={styles.resetBtnText}>ОНОВИТИ</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#8E8E93',
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 18,
  },
  errorDetail: {
    fontSize: 11,
    color: '#FF453A',
    fontFamily: FONTS.medium,
    textAlign: 'center',
    marginTop: 4,
  },
  resetBtn: {
    height: 44,
    borderRadius: 8,
    backgroundColor: '#FF5500',
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    width: '100%',
  },
  resetBtnPressed: {
    opacity: 0.85,
  },
  resetBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    fontFamily: FONTS.bold,
  },
});

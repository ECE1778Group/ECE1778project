import React, {useMemo, useState} from "react";
import {StyleSheet, TouchableOpacity, View} from "react-native";
import {Button, Divider, Text, TextInput} from "react-native-paper";
import {useRouter} from "expo-router";
import {colors} from "../../styles/colors";
import {useUserApi} from "../../lib/api/user";
import {useMessage} from "../../contexts/MessageContext";
import {isValidCode, isValidEmail, isValidPassword} from "../../lib/utils/validation";
import {globalStyles} from "../../styles/globalStyles";

export default function Signup() {
  const router = useRouter();
  const {sendVerificationCode, verifyCode, signup} = useUserApi();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const {showMessage} = useMessage();

  const emailError = !!email && !isValidEmail(email);
  const passwordError = !!password && !isValidPassword(password);
  const confirmError = !!confirmPassword && confirmPassword !== password;
  const codeError = !!verificationCode && !isValidCode(verificationCode);

  const canSubmit = useMemo(() => {
    return (
      !emailError &&
      !passwordError &&
      !confirmError &&
      !codeError &&
      firstName.trim() &&
      lastName.trim()
    );
  }, [emailError, passwordError, confirmError, codeError, firstName, lastName]);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setVerificationCode("");
    setPassword("");
    setConfirmPassword("");
    setIsCodeSent(false);
  };


  const handleSendCode = async () => {
    if (emailError) {
      showMessage("Please enter a valid email first", "error");
      return;
    }
    try {
      await sendVerificationCode(email.trim());
      setIsCodeSent(true);
      showMessage("Verification code sent!", "success");
    } catch {
      setIsCodeSent(false);
      showMessage("Failed to send verification code", "error");
    }
  };

  const handleSignup = async () => {
    if (!email.trim() || !verificationCode.trim() || !password.trim() || !confirmPassword.trim() || !firstName.trim() || !lastName.trim()) {
      showMessage("Please fill in all required fields", "error");
      return;
    }

    if (emailError || passwordError || confirmError || codeError) {
      showMessage("Please fix the form errors before continuing", "error");
      return;
    }

    try {
      await verifyCode(email, verificationCode);
      await signup({
        username: email.split("@")[0],
        password,
        email,
        first_name: firstName,
        last_name: lastName,
      });
      showMessage("Account created successfully!", "success");
      router.replace("/auth/login");
    } catch (err: any) {
      showMessage(err.message || "Signup failed", "error");
    }
  };


  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Create Account
      </Text>

      <TextInput
        label="First Name"
        value={firstName}
        onChangeText={setFirstName}
        style={styles.input}
      />

      <TextInput
        label="Last Name"
        value={lastName}
        onChangeText={setLastName}
        style={styles.input}
      />

      {/* 邮箱 */}
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        error={emailError}
      />
      {emailError && (
        <Text style={styles.errorText}>Enter a valid email</Text>
      )}

      {/* 验证码 */}
      <View style={styles.codeRow}>
        <TextInput
          label="Verification Code"
          value={verificationCode}
          onChangeText={setVerificationCode}
          style={[styles.input, {flex: 1}]}
          error={codeError}
        />
        <Button
          mode="outlined"
          onPress={handleSendCode}
          disabled={!email || emailError}
          style={styles.sendButton}
        >
          {isCodeSent ? "Resend" : "Send Code"}
        </Button>
      </View>
      {codeError && (
        <Text style={styles.errorText}>Code must be 6 digits</Text>
      )}

      {/* 密码 */}
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        textContentType="newPassword"
        autoComplete="password-new"
        importantForAutofill="no"
        secureTextEntry
        style={styles.input}
        error={passwordError}
      />
      {passwordError && (
        <Text style={styles.errorText}>
          Password must be ≥8 chars, with upper/lowercase, number & symbol
        </Text>
      )}

      {/* 确认密码 */}
      <TextInput
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        textContentType="newPassword"
        autoComplete="password-new"
        importantForAutofill="no"
        secureTextEntry
        style={styles.input}
        error={confirmError}
      />
      {confirmError && (
        <Text style={styles.errorText}>Passwords do not match</Text>
      )}

      <Button
        mode="contained"
        onPress={handleSignup}
        disabled={!canSubmit}
        style={styles.button}
      >
        Sign Up
      </Button>

      <Divider style={styles.divider}/>

      <View style={styles.signInRow}>
        <Text style={styles.normalText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => {
          resetForm();
          router.push("/auth/login");
        }}
        >
          <Text style={styles.linkText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...globalStyles.authContainer,
  },
  title: {
    ...globalStyles.formTitleBase,
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
    backgroundColor: "white",
  },
  button: {
    marginVertical: 10,
    borderRadius: 8,
  },
  divider: {
    marginVertical: 16,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sendButton: {
    marginLeft: 8,
    borderRadius: 8,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 6,
    marginLeft: 4,
  },
  signInRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  normalText: {
    color: "#555",
    fontSize: 14,
  },
  linkText: {
    color: colors.primary,
    fontWeight: "bold",
    fontSize: 14,
  },
});

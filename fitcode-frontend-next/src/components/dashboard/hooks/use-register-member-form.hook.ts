import { useState } from 'react';

export type IRegisterMemberFormHook = ReturnType<typeof useRegisterMemberForm>;

interface IFormData {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function useRegisterMemberForm() {
  const DEFAULT_FORM_DATA: IFormData = {
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  };

  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  function resetForm() {
    setFormData(DEFAULT_FORM_DATA);
  }

  function isFormEmpty() {
    return (
      formData.displayName.trim() === '' &&
      formData.email.trim() === '' &&
      formData.password.trim() === '' &&
      formData.confirmPassword.trim() === ''
    );
  }

  function setFormField(field: keyof IFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  return { formData, setFormField, resetForm, isFormEmpty };
}

import { useState } from 'react';

export type IRegisterMemberFormHook = ReturnType<typeof useRegisterMemberForm>;

export interface IFormData {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const DEFAULT_FORM_DATA: IFormData = {
  displayName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export default function useRegisterMemberForm() {
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

  return { formData, setFormData, setFormField, resetForm, isFormEmpty };
}

import { useState } from 'react';

import type { Gender } from '@/core/user/enum/gender.enum';

export type IRegisterMemberFormHook = ReturnType<typeof useRegisterMemberForm>;

export interface IFormData {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  gender: Gender | undefined;
  birthDate: Date | undefined;
}

export const DEFAULT_FORM_DATA: IFormData = {
  displayName: '',
  email: '',
  password: '',
  confirmPassword: '',
  gender: undefined,
  birthDate: undefined,
};

export default function useRegisterMemberForm() {
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  function resetForm() {
    setFormData(DEFAULT_FORM_DATA);
  }

  function isFormEmpty() {
    return (
      formData.displayName.trim() === '' ||
      formData.email.trim() === '' ||
      formData.password.trim() === '' ||
      formData.confirmPassword.trim() === '' ||
      formData.gender === undefined ||
      formData.birthDate === undefined
    );
  }

  function setFormField(
    field: keyof IFormData,
    value: string | Date | undefined
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  const clearFormData = () => {
    setFormField('displayName', '');
    setFormField('email', '');
    setFormField('password', '');
    setFormField('confirmPassword', '');
    setFormField('gender', '');
    setFormField('birthDate', undefined);
  };

  return {
    formData,
    setFormData,
    setFormField,
    resetForm,
    isFormEmpty,
    clearFormData,
  };
}

import { useState } from 'react';

export type UseInstitutionRegisterMemberFormReturnType = ReturnType<
  typeof useInstitutionRegisterMemberForm
>;

export default function useInstitutionRegisterMemberForm() {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  return {
    formData,
    setFormData,
  };
}

import { useState } from "react";

type FormActions<T extends Record<string, string>> = {
  handleChange: (
    e: React.FormEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  setValue: (name: keyof T, value: string) => void;
};

export const useForm = <T extends Record<string, string>>(
  initialValues: T,
): [T, FormActions<T>] => {
  const [values, setValues] = useState(initialValues);
  return [
    values,
    {
      handleChange: (e) => {
        const { name, value } = e.currentTarget;
        setValues((prev) => ({ ...prev, [name]: value }));
      },
      setValue: (name, value) =>
        setValues((prev) => ({ ...prev, [name]: value })),
    },
  ];
};

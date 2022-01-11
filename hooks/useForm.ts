import { useState } from "react";

type Values = {
  [key: string]: string;
};

export const useForm = (
  initialValues: Values
): [
  Values,
  (e: React.FormEvent<HTMLInputElement | HTMLSelectElement>) => void
] => {
  const [values, setValues] = useState(initialValues);
  return [
    values,
    (e) =>
      setValues({ ...values, [e.currentTarget.name]: e.currentTarget.value }),
  ];
};

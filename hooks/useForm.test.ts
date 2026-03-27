import { renderHook, act } from "@testing-library/react";
import { useForm } from "./useForm";

describe("useForm", () => {
  describe("handleChange", () => {
    it("updates the named field when an input changes", () => {
      const { result } = renderHook(() =>
        useForm({ name: "Alice", age: "30" }),
      );
      const [, { handleChange }] = result.current;

      act(() => {
        handleChange({
          currentTarget: { name: "name", value: "Bob" },
        } as React.FormEvent<HTMLInputElement>);
      });

      expect(result.current[0].name).toBe("Bob");
      expect(result.current[0].age).toBe("30");
    });
  });

  describe("setValue", () => {
    it("directly sets the named field to a given value", () => {
      const { result } = renderHook(() =>
        useForm({ salary: "1000", dividend: "0" }),
      );
      const [, { setValue }] = result.current;

      act(() => {
        setValue("salary", "5000");
      });

      expect(result.current[0].salary).toBe("5000");
      expect(result.current[0].dividend).toBe("0");
    });

    it("does not mutate other fields when setting one value", () => {
      const { result } = renderHook(() => useForm({ a: "1", b: "2", c: "3" }));
      const [, { setValue }] = result.current;

      act(() => {
        setValue("b", "99");
      });

      expect(result.current[0].a).toBe("1");
      expect(result.current[0].b).toBe("99");
      expect(result.current[0].c).toBe("3");
    });
  });
});

package com.playground.patterns;

public class FindMax {

    /**
     * Finds the maximum value in the given array.
     *
     * @param numbers input array
     * @return maximum value
     * @throws IllegalArgumentException if array is null or empty
     */
    public static int findMax(int[] numbers) {

        validateInput(numbers);

        int maxValue = numbers[0];

        for (int i = 1; i < numbers.length; i++) {
            int currentValue = numbers[i];

            if (currentValue > maxValue) {
                maxValue = currentValue;
            }
        }

        return maxValue;
    }

    /**
     * Validates the input array.
     */
    private static void validateInput(int[] numbers) {
        if (numbers == null || numbers.length == 0) {
            throw new IllegalArgumentException("Input array must not be null or empty");
        }
    }

    public static void main(String[] args) {

        int[] numbers = { 3, 7, 2, 9, 5 };

        int max = findMax(numbers);

        System.out.println("Maximum value: " + max);
    }
}
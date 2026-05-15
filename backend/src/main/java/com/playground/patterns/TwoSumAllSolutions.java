package com.playground.patterns;

import java.util.*;

public class TwoSumAllSolutions {

    public static void main(String[] args) {

        int[] nums = { 3, 5, 1, 7 };
        int target = 8;

        System.out.println("=== Brute Force ===");
        printResult(bruteForce(nums, target));

        System.out.println("=== HashMap (Best for Unsorted) ===");
        printResult(hashMapSolution(nums, target));

        System.out.println("=== Two Pointers (Sorted Only) ===");
        int[] sortedNums = { 1, 2, 3, 4, 6 };
        printResult(twoPointers(sortedNums, 6));

        System.out.println("=== Sort + Two Pointers (Hybrid) ===");
        printResult(sortThenTwoPointers(nums, target));
    }

    // ---------------------------------------
    // 1. Brute Force (O(n^2))
    // ---------------------------------------
    public static int[] bruteForce(int[] nums, int target) {

        if (nums == null || nums.length < 2)
            return new int[] {};

        for (int i = 0; i < nums.length; i++) {
            for (int j = i + 1; j < nums.length; j++) {

                if (nums[i] + nums[j] == target) {
                    return new int[] { i, j };
                }
            }
        }

        return new int[] {};
    }

    // ---------------------------------------
    // 2. HashMap (O(n)) - Best for Unsorted
    // ---------------------------------------
    public static int[] hashMapSolution(int[] nums, int target) {

        if (nums == null || nums.length < 2)
            return new int[] {};

        Map<Integer, Integer> seen = new HashMap<>();

        for (int i = 0; i < nums.length; i++) {

            int complement = target - nums[i];

            if (seen.containsKey(complement)) {
                return new int[] { seen.get(complement), i };
            }

            seen.put(nums[i], i);
        }

        return new int[] {};
    }

    // ---------------------------------------
    // 3. Two Pointers (O(n)) - Sorted Only
    // ---------------------------------------
    public static int[] twoPointers(int[] nums, int target) {

        if (nums == null || nums.length < 2)
            return new int[] {};

        int left = 0;
        int right = nums.length - 1;

        while (left < right) {

            int sum = nums[left] + nums[right];

            if (sum == target) {
                return new int[] { left, right };
            } else if (sum < target) {
                left++;
            } else {
                right--;
            }
        }

        return new int[] {};
    }

    // ---------------------------------------
    // 4. Sort + Two Pointers (O(n log n))
    // ---------------------------------------
    public static int[] sortThenTwoPointers(int[] nums, int target) {

        if (nums == null || nums.length < 2)
            return new int[] {};

        int[][] arr = new int[nums.length][2];

        // store value + original index
        for (int i = 0; i < nums.length; i++) {
            arr[i][0] = nums[i];
            arr[i][1] = i;
        }

        // sort by value
        Arrays.sort(arr, Comparator.comparingInt(a -> a[0]));

        int left = 0;
        int right = arr.length - 1;

        while (left < right) {

            int sum = arr[left][0] + arr[right][0];

            if (sum == target) {
                return new int[] { arr[left][1], arr[right][1] };
            } else if (sum < target) {
                left++;
            } else {
                right--;
            }
        }

        return new int[] {};
    }

    // ---------------------------------------
    // Helper
    // ---------------------------------------
    public static void printResult(int[] result) {
        if (result.length == 0) {
            System.out.println("No solution found");
        } else {
            System.out.println("Result: " + result[0] + ", " + result[1]);
        }
    }
}
package com.playground.controller;

import com.playground.dto.UserRequestDTO;
import com.playground.dto.UserResponseDTO;
import com.playground.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

	private final UserService userService;

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public UserResponseDTO createUser(@Valid @RequestBody UserRequestDTO dto) {
		return userService.createUser(dto);
	}

	@GetMapping("/{id}")
	public UserResponseDTO getUserById(@PathVariable Long id) {
		return userService.getUserById(id);
	}

	@GetMapping
	public List<UserResponseDTO> getAllUsers() {
		return userService.getAllUsers();
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteUser(@PathVariable Long id) {
		userService.deleteUser(id);
	}

}

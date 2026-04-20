package com.playground.service;

import com.playground.dto.UserRequestDTO;
import com.playground.dto.UserResponseDTO;

import java.util.List;

public interface UserService {

	UserResponseDTO createUser(UserRequestDTO dto);

	UserResponseDTO getUserById(Long id);

	List<UserResponseDTO> getAllUsers();

	void deleteUser(Long id);

}

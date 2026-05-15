package com.playground.mapper;

import com.playground.dto.UserRequestDTO;
import com.playground.dto.UserResponseDTO;
import com.playground.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

	public User mapToEntity(UserRequestDTO dto) {
		return User.builder()
				.name(dto.getName())
				.email(dto.getEmail())
				.password(dto.getPassword())
				.build();
	}

	public UserResponseDTO mapToResponse(User entity) {
		return UserResponseDTO.builder()
				.id(entity.getId())
				.name(entity.getName())
				.email(entity.getEmail())
				.createdAt(entity.getCreatedAt())
				.build();
	}

}

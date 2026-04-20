package com.playground.service.impl;

import com.playground.dto.UserRequestDTO;
import com.playground.dto.UserResponseDTO;
import com.playground.entity.User;
import com.playground.exception.DuplicateEmailException;
import com.playground.exception.UserNotFoundException;
import com.playground.mapper.UserMapper;
import com.playground.repository.UserRepository;
import com.playground.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

	private final UserRepository userRepository;
	private final UserMapper userMapper;

	@Override
	@Transactional
	public UserResponseDTO createUser(UserRequestDTO dto) {
		log.info("Creating user with email={}", dto.getEmail());
		if (userRepository.findByEmail(dto.getEmail()).isPresent()) {
			log.error("Duplicate email on create: {}", dto.getEmail());
			throw new DuplicateEmailException(dto.getEmail(), "Email already registered");
		}
		User entity = userMapper.mapToEntity(dto);
		User saved = userRepository.save(entity);
		log.info("User created successfully id={}", saved.getId());
		return userMapper.mapToResponse(saved);
	}

	@Override
	@Transactional(readOnly = true)
	public UserResponseDTO getUserById(Long id) {
		User user = userRepository.findById(id)
				.orElseThrow(() -> new UserNotFoundException(id));
		return userMapper.mapToResponse(user);
	}

	@Override
	@Transactional(readOnly = true)
	public List<UserResponseDTO> getAllUsers() {
		return userRepository.findAll().stream()
				.map(userMapper::mapToResponse)
				.toList();
	}

	@Override
	@Transactional
	public void deleteUser(Long id) {
		log.info("Deleting user id={}", id);
		if (!userRepository.existsById(id)) {
			log.error("Delete failed: user not found id={}", id);
			throw new UserNotFoundException(id);
		}
		userRepository.deleteById(id);
		log.info("User deleted id={}", id);
	}

}

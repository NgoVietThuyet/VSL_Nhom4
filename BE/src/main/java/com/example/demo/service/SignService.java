package com.example.demo.service;

import com.example.demo.dto.request.practice.PracticeSubmitRequest;
import com.example.demo.dto.request.progress.ProgressUpdateRequest;
import com.example.demo.dto.response.practice.PracticeAttemptResponse;
import com.example.demo.dto.response.progress.LearningProgressResponse;
import com.example.demo.dto.response.sign.SignResponse;

import java.util.List;

public interface SignService {

    List<SignResponse> getAllSigns(String search, Long topicId);

    SignResponse getSignById(Long signId);

    PracticeAttemptResponse submitPractice(Long signId, PracticeSubmitRequest request, String userEmail);

    LearningProgressResponse updateProgress(Long signId, ProgressUpdateRequest request, String userEmail);
}
